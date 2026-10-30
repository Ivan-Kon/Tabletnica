import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { store, createStore } from "../src/mocks/store.js";
import { authService } from "../src/services/authService.js";
import { patientsService } from "../src/services/patientsService.js";
import { prescriptionsService } from "../src/services/prescriptionsService.js";
import { pillboxesService } from "../src/services/pillboxesService.js";
import { alertsService } from "../src/services/alertsService.js";
import { eventsService } from "../src/services/eventsService.js";

beforeEach(async () => {
  Object.assign(store, createStore());
  await authService.logout();
});
test("wrong login does not create a session; correct login and logout update session", async () => {
  await assert.rejects(authService.login("nurse", "wrong"), /Неверный/);
  assert.equal(authService.current(), null);
  assert.equal((await authService.login("nurse", "demo123")).role, "NURSE");
  await authService.logout();
  assert.equal(authService.current(), null);
});
test("not-found patients and devices fail explicitly; returned data cannot mutate store", async () => {
  await assert.rejects(patientsService.getPatient(999), /не найден/);
  await assert.rejects(pillboxesService.getPillbox(999), /не найдена/);
  const patients = await patientsService.getPatients();
  patients[0].full_name = "Changed";
  assert.notEqual((await patientsService.getPatient(1)).full_name, "Changed");
});
test("multi-item prescription preserves a single paper document and distinct schedules", async () => {
  const common = {
    dosage: "100 мг",
    quantity: 1,
    start_date: "2026-10-16",
    end_date: "",
  };
  const document = await prescriptionsService.addPrescription(
    1,
    "Тестовый врач",
    [
      {
        ...common,
        drug_name: "Тест А",
        schedule: {
          schedule_type: "SPECIFIC_TIME",
          specific_times: ["08:00", "20:00"],
        },
      },
      {
        ...common,
        drug_name: "Тест Б",
        schedule: {
          schedule_type: "INTERVAL",
          interval_minutes: 360,
          anchor_at: "2026-10-16T21:30:00+03:00",
        },
      },
    ],
    1,
  );
  const items = (await prescriptionsService.getPatientPrescriptions(1)).filter(
    (i) => i.prescription_id === document.id,
  );
  assert.equal(items.length, 2);
  assert.equal(document.entered_by, 1);
  assert.equal(document.source_type, "paper");
  assert.notEqual(items[0].schedule.id, items[1].schedule.id);
  assert.equal(items[1].schedule.interval_minutes, 360);
});
test("assigned device disappears from available devices and appears on patient", async () => {
  const before = await pillboxesService.getAvailablePillboxes();
  assert.ok(before.every((b) => b.status === "AVAILABLE"));
  await pillboxesService.assignPillbox(1, 1, 1);
  assert.ok(
    !(await pillboxesService.getAvailablePillboxes()).some((b) => b.id === 1),
  );
  assert.equal((await pillboxesService.getPatientPillbox(1)).id, 1);
  assert.equal((await pillboxesService.getPillbox(1)).cells.length, 9);
});
test("alerts can be reviewed and event history is patient-scoped and newest-first", async () => {
  await alertsService.markReviewed(1);
  assert.equal(
    (await alertsService.getAlerts()).find((a) => a.id === 1).status,
    "reviewed",
  );
  await assert.rejects(alertsService.markReviewed(999), /не найдено/);
  const events = await eventsService.getEvents(2);
  assert.ok(events.every((e) => e.patient_id === 2));
  assert.ok(
    events.every(
      (e, i) =>
        !i || new Date(events[i - 1].occurred_at) >= new Date(e.occurred_at),
    ),
  );
  assert.deepEqual(await eventsService.getEvents(1), []);
});
