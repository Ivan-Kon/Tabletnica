import test from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../src/mocks/store.js";
import {
  configureCell,
  confirmFilling,
} from "../src/services/pillboxesService.js";
import { upcomingOccurrences } from "../src/services/schedule.js";

test("replacing a cell releases the old prescription status without hiding another active cell", () => {
  const db = createStore();
  db.prescriptionItems.forEach((item) => {
    item.end_date = null;
  });
  configureCell(db, 4, 1, 3, new Date().toISOString(), "", 1);
  assert.equal(
    db.prescriptionItems.find((i) => i.id === 2).status,
    "pending_setup",
  );
  assert.equal(db.prescriptionItems.find((i) => i.id === 3).status, "active");
});

test("expired prescription prevents confirmation atomically", () => {
  const db = createStore();
  db.prescriptionItems.forEach((item) => {
    item.end_date = null;
  });
  configureCell(db, 4, 1, 2, new Date().toISOString(), "", 1);
  db.prescriptionItems.find((i) => i.id === 3).end_date = "2000-01-01";
  const before = structuredClone(db);
  assert.throws(() => confirmFilling(db, 4, 1), /Ячейка №2/);
  assert.deepEqual(db, before);
});

test("discharged patient cannot confirm filling", () => {
  const db = createStore();
  db.prescriptionItems.forEach((item) => {
    item.end_date = null;
  });
  configureCell(db, 4, 1, 2, new Date().toISOString(), "", 1);
  db.patients.find((p) => p.id === 2).status = "discharged";
  assert.throws(() => confirmFilling(db, 4, 1), /больше не активен/);
  assert.equal(db.deviceConfigs.length, 0);
});

test("preview includes night hours and tolerates incomplete form input", () => {
  const item = { start_date: "2026-10-15", end_date: "2026-10-16" };
  const schedule = {
    schedule_type: "INTERVAL",
    interval_minutes: 360,
    anchor_at: "2026-10-15T21:30:00+03:00",
  };
  assert.deepEqual(
    upcomingOccurrences(
      item,
      schedule,
      new Date("2026-10-15T21:00:00+03:00"),
    ).map((d) => d.toISOString()),
    [
      "2026-10-15T18:30:00.000Z",
      "2026-10-16T00:30:00.000Z",
      "2026-10-16T06:30:00.000Z",
      "2026-10-16T12:30:00.000Z",
    ],
  );
  assert.deepEqual(
    upcomingOccurrences(item, { ...schedule, interval_minutes: 0 }),
    [],
  );
  assert.deepEqual(
    upcomingOccurrences(item, {
      schedule_type: "SPECIFIC_TIME",
      specific_times: [""],
    }),
    [],
  );
});
