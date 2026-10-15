import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/mocks/store.js";
import {
  assignPillbox,
  configureCell,
  confirmFilling,
} from "../src/services/pillboxesService.js";
import { nextOccurrence } from "../src/services/schedule.js";
import { validateItem } from "../src/services/prescriptionsService.js";
test("assignment → configuration → filling retains audit and creates prepared config", () => {
  const db = createStore();
  const assignment = assignPillbox(db, 1, 1, 1);
  assert.equal(assignment.patient_id, 1);
  assert.equal(db.pillboxes[0].status, "ASSIGNED");
  const cell = configureCell(
    db,
    1,
    1,
    1,
    new Date().toISOString(),
    "В блистере",
    1,
  );
  assert.equal(cell.baseline_weight, null);
  assert.equal(cell.configured_by, 1);
  const result = confirmFilling(db, 1, 1);
  assert.equal(result.status, "PREPARED");
  assert.equal(result.version, 1);
  assert.equal(
    db.configurations.find((c) => c.pillbox_id === 1).status,
    "ACTIVE",
  );
  assert.equal(db.deviceConfigs[0].cells[0].filled_by, 1);
  assert.equal(db.events.at(-1).type, "CONFIG_PREPARED");
  assert.throws(() => confirmFilling(db, 1, 1), /Нет настроенных/);
});
test("cannot double-assign a device or assign a second device to a patient", () => {
  const db = createStore();
  assignPillbox(db, 1, 1, 1);
  assert.throws(() => assignPillbox(db, 1, 3, 1), /не доступно/);
  assert.throws(() => assignPillbox(db, 7, 1, 1), /уже передана/);
  assert.throws(() => assignPillbox(db, 7, 4, 1), /активному/);
  assert.throws(
    () => configureCell(db, 1, 1, 2, new Date().toISOString(), "", 1),
    /этого пациента/,
  );
  assert.throws(
    () => configureCell(db, 1, 10, 1, new Date().toISOString(), "", 1),
    /номер/,
  );
});
test("interval includes 03:30 at night and respects course end", () => {
  const item = {
    start_date: "2026-10-15",
    end_date: "2026-10-16",
    status: "active",
  };
  const schedule = {
    schedule_type: "INTERVAL",
    interval_minutes: 360,
    anchor_at: "2026-10-15T21:30:00+03:00",
  };
  assert.equal(
    nextOccurrence(
      item,
      schedule,
      new Date("2026-10-15T22:00:00+03:00"),
    ).toISOString(),
    "2026-10-16T00:30:00.000Z",
  );
  assert.equal(
    nextOccurrence(item, schedule, new Date("2026-10-17T00:00:00+03:00")),
    null,
  );
});
test("specific times roll over midnight without using host timezone", () => {
  const item = {
    start_date: "2026-10-15",
    end_date: "2026-10-17",
    status: "active",
  };
  const schedule = {
    schedule_type: "SPECIFIC_TIME",
    specific_times: ["20:00", "08:00"],
  };
  assert.equal(
    nextOccurrence(
      item,
      schedule,
      new Date("2026-10-15T23:00:00+03:00"),
    ).toISOString(),
    "2026-10-16T05:00:00.000Z",
  );
});
test("prescription rejects duplicate times, invalid quantities and backwards dates", () => {
  const item = {
    drug_name: "Тест",
    dosage: "100 мг",
    quantity: 1,
    start_date: "2026-10-15",
    end_date: "2026-10-20",
    schedule: {
      schedule_type: "SPECIFIC_TIME",
      specific_times: ["08:00", "08:00"],
    },
  };
  assert.throws(() => validateItem(item), /различные/);
  item.schedule.specific_times = ["08:00"];
  item.quantity = 0;
  assert.throws(() => validateItem(item), /положительное/);
  item.quantity = 1;
  item.end_date = "2026-10-14";
  assert.throws(() => validateItem(item), /Дата окончания/);
});
