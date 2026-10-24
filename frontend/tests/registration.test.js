import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { store, createStore } from "../src/mocks/store.js";
import { patientsService } from "../src/services/patientsService.js";
import { pillboxesService } from "../src/services/pillboxesService.js";
import { prescriptionsService } from "../src/services/prescriptionsService.js";

beforeEach(() => Object.assign(store, createStore()));
const patient = () => ({
  full_name: "  Новый Пациент  ",
  room_number: "410",
  bed_number: "1",
  status: "active",
});
const device = () => ({
  device_id: "TEST-100",
  serial_number: "SN-100",
  model: "БП",
  status: "AVAILABLE",
  token: "test-token-123456789",
  online: true,
});

test("registered patient and device participate in assignment and configuration", async () => {
  const p = await patientsService.register(patient());
  const b = await pillboxesService.register(device());
  assert.equal(
    (await patientsService.getPatient(p.id)).full_name,
    "Новый Пациент",
  );
  assert.ok(
    (await pillboxesService.getAvailablePillboxes()).some(
      (box) => box.id === b.id,
    ),
  );
  assert.equal((await pillboxesService.getPillbox(b.id)).cells.length, 9);
  assert.ok(
    (await pillboxesService.getPillbox(b.id)).cells.every(
      (cell) => cell.status === "EMPTY",
    ),
  );
  await pillboxesService.assignPillbox(b.id, p.id, 1);
  await prescriptionsService.addPrescription(
    p.id,
    "Врач",
    [
      {
        drug_name: "Тест",
        dosage: "100 мг",
        quantity: 1,
        start_date: "2026-01-01",
        end_date: "",
        schedule: { schedule_type: "SPECIFIC_TIME", specific_times: ["08:00"] },
      },
    ],
    1,
  );
  const [item] = await prescriptionsService.getPatientPrescriptions(p.id);
  await pillboxesService.configureCell(
    b.id,
    1,
    item.id,
    new Date().toISOString(),
    "",
    1,
  );
  const config = await pillboxesService.confirmFilling(b.id, 1);
  assert.equal(config.cells[0].status, "ACTIVE");
});

test("occupied bed and invalid patient are rejected without mutation", async () => {
  const before = structuredClone(store);
  await assert.rejects(
    patientsService.register({
      ...patient(),
      room_number: "204",
      bed_number: "2",
    }),
    /занята/,
  );
  await assert.rejects(
    patientsService.register({ ...patient(), full_name: " " }),
    /ФИО/,
  );
  await assert.rejects(
    patientsService.register({ ...patient(), status: "unknown" }),
    /статус/,
  );
  assert.deepEqual(store, before);
  const p = await patientsService.register({
    ...patient(),
    room_number: "207",
  });
  assert.equal(p.status, "active"); // Discharged patient's bed can be reused.
});

test("device duplicates and unsupported status are rejected; token is never retained", async () => {
  const b = await pillboxesService.register(device());
  assert.equal(b.token, undefined);
  assert.ok(!JSON.stringify(store).includes(device().token));
  const before = structuredClone(store);
  await assert.rejects(
    pillboxesService.register({ ...device(), serial_number: " sn-100 " }),
    /серийным/,
  );
  await assert.rejects(
    pillboxesService.register({ ...device(), serial_number: "OTHER" }),
    /Название/,
  );
  await assert.rejects(
    pillboxesService.register({ ...device(), status: "ACTIVE" }),
    /активным/,
  );
  await assert.rejects(
    pillboxesService.register({ ...device(), token: "short" }),
    /Токен/,
  );
  assert.deepEqual(store, before);
});

test("registration does not imply connection and offline state overrides demo checkbox", async () => {
  const p = await patientsService.register(patient());
  const b = await pillboxesService.register({ ...device(), online: false });
  assert.equal(b.last_seen_at, null);
  await assert.rejects(
    pillboxesService.assignPillbox(b.id, p.id, 1),
    /не доступно/,
  );
  const offline = await pillboxesService.register({
    ...device(),
    device_id: "OFFLINE-1",
    serial_number: "OFFLINE-1",
    status: "OFFLINE",
  });
  assert.equal(offline.online, false);
  assert.equal(offline.last_seen_at, null);
});
