import { store, nextId } from "../mocks/store.js";
import { getItems } from "./prescriptionsService.js";
import { useMocks } from "./api.js";
import { futureApi } from "./futureApi.js";
export function assignPillbox(db, pillboxId, patientId, userId) {
  const box = db.pillboxes.find((p) => p.id === Number(pillboxId));
  const patient = db.patients.find((p) => p.id === Number(patientId));
  if (!patient || patient.status !== "active")
    throw new Error("Передача доступна только активному пациенту.");
  if (!box || box.status !== "AVAILABLE" || !box.online)
    throw new Error("Устройство больше не доступно для передачи.");
  if (
    db.assignments.some(
      (a) => a.patient_id === patient.id && a.status === "active",
    )
  )
    throw new Error("Пациенту уже передана таблетница.");
  const assignment = {
    id: nextId(db.assignments),
    pillbox_id: box.id,
    patient_id: patient.id,
    assigned_by: userId,
    assigned_at: new Date().toISOString(),
    status: "active",
  };
  db.assignments.push(assignment);
  box.status = "ASSIGNED";
  return { ...assignment };
}
export function configureCell(
  db,
  boxId,
  cellNumber,
  itemId,
  loadedAt,
  comment,
  userId,
) {
  const box = db.pillboxes.find((b) => b.id === Number(boxId));
  const assignment = db.assignments.find(
    (a) => a.pillbox_id === Number(boxId) && a.status === "active",
  );
  const item = getItems(db).find((i) => i.id === Number(itemId));
  const today = new Date(Date.now() + 10800000).toISOString().slice(0, 10);
  if (!box?.online || !assignment)
    throw new Error(
      "Для настройки нужна переданная пациенту таблетница в сети.",
    );
  if (
    !item ||
    item.prescription.patient_id !== assignment.patient_id ||
    ["paused", "completed"].includes(item.status) ||
    (item.end_date && item.end_date < today)
  )
    throw new Error("Выберите действующее назначение этого пациента.");
  if (!Number.isInteger(Number(cellNumber)) || cellNumber < 1 || cellNumber > 9)
    throw new Error("Неверный номер ячейки.");
  const loaded = new Date(loadedAt);
  if (
    !Number.isFinite(loaded.getTime()) ||
    loaded > new Date(Date.now() + 60000)
  )
    throw new Error("Время заполнения не может быть в будущем.");
  let configuration = db.configurations.find(
    (c) => c.pillbox_id === box.id && c.cell_number === Number(cellNumber),
  );
  const fields = {
    pillbox_id: box.id,
    cell_number: Number(cellNumber),
    assignment_id: assignment.id,
    prescription_item_id: item.id,
    status: "CONFIGURED",
    configured_by: userId,
    configured_at: new Date().toISOString(),
    loaded_at: loadedAt,
    comment,
    baseline_weight: null,
  };
  if (configuration) Object.assign(configuration, fields);
  else {
    configuration = { id: nextId(db.configurations), ...fields };
    db.configurations.push(configuration);
  }
  db.prescriptionItems.find((i) => i.id === item.id).status = "configured";
  return { ...configuration };
}
export function confirmFilling(db, boxId, userId) {
  const box = db.pillboxes.find((b) => b.id === Number(boxId));
  const assignment = db.assignments.find(
    (a) => a.pillbox_id === Number(boxId) && a.status === "active",
  );
  const cells = db.configurations.filter((c) => c.pillbox_id === Number(boxId));
  if (
    !box?.online ||
    !assignment ||
    !cells.some((c) => c.status === "CONFIGURED")
  )
    throw new Error("Нет настроенных изменений для подтверждения.");
  const timestamp = new Date().toISOString();
  cells.forEach((c) => {
    if (c.status !== "CONFIGURED") return;
    // Simulated sensor measurement, never derived from tablet dosage or expected weight.
    c.baseline_weight = Number((12 + c.cell_number * 0.37).toFixed(2));
    c.status = "ACTIVE";
    c.filled_by = userId;
    c.filled_at = timestamp;
    db.prescriptionItems.find((i) => i.id === c.prescription_item_id).status =
      "active";
  });
  box.status = "ACTIVE";
  const config = {
    id: nextId(db.deviceConfigs),
    pillbox_id: box.id,
    version: db.deviceConfigs.filter((c) => c.pillbox_id === box.id).length + 1,
    status: "PREPARED",
    prepared_at: timestamp,
    prepared_by: userId,
    cells: structuredClone(cells),
  };
  db.deviceConfigs.push(config);
  db.events.push({
    id: nextId(db.events),
    patient_id: assignment.patient_id,
    pillbox_id: box.id,
    type: "CONFIG_PREPARED",
    occurred_at: timestamp,
  });
  return structuredClone(config);
}
export const pillboxesService = {
  async getAll() {
    if (!useMocks) return futureApi("/pillboxes");
    return structuredClone(
      store.pillboxes.map((box) => ({
        ...box,
        assignment: store.assignments.find(
          (a) => a.pillbox_id === box.id && a.status === "active",
        ),
      })),
    );
  },
  async getAvailablePillboxes() {
    return (await this.getAll()).filter((b) => b.status === "AVAILABLE");
  },
  async getPatientPillbox(patientId) {
    return (
      (await this.getAll()).find(
        (b) => b.assignment?.patient_id === Number(patientId),
      ) || null
    );
  },
  async getPillbox(id) {
    if (!useMocks) return futureApi(`/pillboxes/${Number(id)}`);
    const box = (await this.getAll()).find((b) => b.id === Number(id));
    if (!box) throw new Error("Таблетница не найдена.");
    const items = getItems();
    const cells = Array.from({ length: 9 }, (_, i) => {
      const config = store.configurations.find(
        (c) => c.pillbox_id === box.id && c.cell_number === i + 1,
      );
      return {
        cell_number: i + 1,
        status: "EMPTY",
        ...config,
        item: config
          ? items.find((item) => item.id === config.prescription_item_id)
          : null,
      };
    });
    return structuredClone({
      ...box,
      cells,
      patient: store.patients.find((p) => p.id === box.assignment?.patient_id),
      latestConfig: store.deviceConfigs
        .filter((c) => c.pillbox_id === box.id)
        .at(-1),
    });
  },
  async assignPillbox(boxId, patientId, userId) {
    if (!useMocks)
      return futureApi(`/pillboxes/${Number(boxId)}/assignment`, {
        method: "POST",
        body: JSON.stringify({ patient_id: Number(patientId) }),
      });
    return assignPillbox(store, boxId, patientId, userId);
  },
  async configureCell(...args) {
    if (!useMocks) {
      const [boxId, cellNumber, itemId, loadedAt, comment] = args;
      return futureApi(
        `/pillboxes/${Number(boxId)}/cells/${Number(cellNumber)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            prescription_item_id: Number(itemId),
            loaded_at: loadedAt,
            comment,
          }),
        },
      );
    }
    return configureCell(store, ...args);
  },
  async confirmFilling(boxId, userId) {
    if (!useMocks)
      return futureApi(`/pillboxes/${Number(boxId)}/filling`, {
        method: "POST",
        body: "{}",
      });
    return confirmFilling(store, boxId, userId);
  },
};
