import test from "node:test";
import assert from "node:assert/strict";
import { createStore, store } from "../src/mocks/store.js";
import {
  clearCell,
  configureCell,
  confirmFilling,
  assignPillbox,
} from "../src/services/pillboxesService.js";
import {
  validateItem,
  prescriptionsService,
} from "../src/services/prescriptionsService.js";
import { api } from "../src/services/api.js";

function fixture() {
  const db = createStore();
  db.prescriptionItems.forEach((i) => {
    i.end_date = null;
  });
  return db;
}
test("clear all cells, confirm empty configuration, then refill with a new version", () => {
  const db = fixture();
  clearCell(db, 4, 1, 1);
  clearCell(db, 4, 2, 1);
  assert.equal(
    db.prescriptionItems.find((i) => i.id === 2).status,
    "pending_setup",
  );
  const empty = confirmFilling(db, 4, 1);
  assert.equal(empty.cells.length, 9);
  assert.ok(empty.cells.every((c) => c.status === "EMPTY"));
  assert.equal(db.pillboxes.find((b) => b.id === 4).status, "ASSIGNED");
  assert.throws(() => confirmFilling(db, 4, 1), /Нет настроенных/);
  configureCell(
    db,
    4,
    1,
    2,
    new Date().toISOString(),
    "Повторное заполнение",
    1,
  );
  const filled = confirmFilling(db, 4, 1);
  assert.equal(filled.version, 2);
  assert.equal(filled.cells[0].status, "ACTIVE");
  assert.equal(empty.cells[0].status, "EMPTY");
});
test("expired cell can be cleared without an active prescription", () => {
  const db = fixture();
  db.prescriptionItems.find((i) => i.id === 2).end_date = "2000-01-01";
  clearCell(db, 4, 1, 1);
  assert.equal(confirmFilling(db, 4, 1).cells[0].status, "EMPTY");
});
test("reconfiguring clears previous filling audit; snapshots remain unchanged", () => {
  const db = fixture();
  configureCell(db, 4, 1, 2, new Date().toISOString(), "", 1);
  const first = confirmFilling(db, 4, 1);
  const before = structuredClone(first);
  const next = configureCell(db, 4, 1, 3, new Date().toISOString(), "", 1);
  assert.equal(next.filled_at, null);
  assert.equal(next.filled_by, null);
  assert.equal(next.baseline_weight, null);
  assert.deepEqual(db.deviceConfigs[0], before);
});
test("offline mutations and configuration for a discharged patient are rejected", () => {
  const db = fixture();
  db.pillboxes.find((b) => b.id === 4).online = false;
  assert.throws(() => clearCell(db, 4, 1, 1), /в сети/);
  assert.throws(
    () => configureCell(db, 4, 1, 2, new Date().toISOString(), "", 1),
    /в сети/,
  );
  db.pillboxes.find((b) => b.id === 4).online = true;
  db.patients.find((p) => p.id === 2).status = "discharged";
  assert.throws(
    () => configureCell(db, 4, 1, 2, new Date().toISOString(), "", 1),
    /активному/,
  );
  assert.throws(() => assignPillbox(db, 9, 1, 1), /не доступно/);
});
test("prescription rejects impossible dates and unsupported schedule modes", () => {
  const item = {
    drug_name: "Тест",
    dosage: "100 мг",
    quantity: 1,
    start_date: "2026-02-30",
    schedule: { schedule_type: "SPECIFIC_TIME", specific_times: ["08:00"] },
  };
  assert.throws(() => validateItem(item), /Дата окончания/);
  item.start_date = "2026-10-16";
  item.quantity = Infinity;
  assert.throws(() => validateItem(item), /положительное/);
  item.quantity = 1;
  item.schedule.schedule_type = "UNKNOWN";
  assert.throws(() => validateItem(item), /тип расписания/);
});
test("adding a multi-item prescription validates everything before mutation", async () => {
  const before = structuredClone(store);
  await assert.rejects(
    prescriptionsService.addPrescription(
      1,
      "Врач",
      [
        {
          drug_name: "Тест",
          dosage: "100 мг",
          quantity: 1,
          start_date: "2026-10-16",
          schedule: {
            schedule_type: "SPECIFIC_TIME",
            specific_times: ["08:00"],
          },
        },
        { drug_name: "" },
      ],
      1,
    ),
  );
  assert.deepEqual(store, before);
  await assert.rejects(
    prescriptionsService.addPrescription(
      4,
      "Врач",
      [
        {
          drug_name: "Тест",
          dosage: "100 мг",
          quantity: 1,
          start_date: "2026-10-16",
          schedule: {
            schedule_type: "SPECIFIC_TIME",
            specific_times: ["08:00"],
          },
        },
      ],
      1,
    ),
    /активному/,
  );
  assert.deepEqual(store, before);
});
test("fetch wrapper includes cookies and handles network, HTTP and empty responses", async (t) => {
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.credentials, "include");
    return new Response(null, { status: 204 });
  });
  assert.equal(await api("/test"), null);
  globalThis.fetch.mock.mockImplementation(
    async () =>
      new Response(JSON.stringify({ detail: "Ошибка проверки" }), {
        status: 422,
      }),
  );
  await assert.rejects(api("/test"), /Ошибка проверки/);
  globalThis.fetch.mock.mockImplementation(async () => {
    throw new TypeError("Failed to fetch");
  });
  await assert.rejects(api("/test"), /Не удалось связаться/);
});
