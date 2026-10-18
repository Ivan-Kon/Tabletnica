import { store, nextId } from "../mocks/store.js";
import { getItems } from "./prescriptionsService.js";
import { useMocks } from "./api.js";
import { futureApi } from "./futureApi.js";
import { pillboxFields } from "./registration.js";
function refreshItemStatus(db, itemId) {
  const item = db.prescriptionItems.find((i) => i.id === itemId);
  if (!item || ["paused", "completed"].includes(item.status)) return;
  const cells = db.configurations.filter(
    (c) => c.prescription_item_id === itemId,
  );
  item.status = cells.some((c) => c.status === "ACTIVE")
    ? "active"
    : cells.some((c) => c.status === "CONFIGURED")
      ? "configured"
      : "pending_setup";
}
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
    db.patients.find((p) => p.id === assignment.patient_id)?.status !== "active"
  )
    throw new Error("Настройка доступна только активному пациенту.");
  if (
    !item ||
    item.prescription?.patient_id !== assignment.patient_id ||
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
  const previousItemId = configuration?.prescription_item_id;
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
    filled_by: null,
    filled_at: null,
    pending_change: true,
  };
  if (configuration) Object.assign(configuration, fields);
  else {
    configuration = { id: nextId(db.configurations), ...fields };
    db.configurations.push(configuration);
  }
  refreshItemStatus(db, previousItemId);
  refreshItemStatus(db, item.id);
  return { ...configuration };
}
export function clearCell(db, boxId, cellNumber, userId) {
  const box = db.pillboxes.find((b) => b.id === Number(boxId));
  const assignment = db.assignments.find(
    (a) => a.pillbox_id === box?.id && a.status === "active",
  );
  if (!box?.online || !assignment)
    throw new Error(
      "Для освобождения ячейки нужна переданная таблетница в сети.",
    );
  const cell = db.configurations.find(
    (c) => c.pillbox_id === box.id && c.cell_number === Number(cellNumber),
  );
  if (!cell || cell.status === "EMPTY") throw new Error("Ячейка уже пуста.");
  const previousItemId = cell.prescription_item_id;
  Object.assign(cell, {
    prescription_item_id: null,
    status: "EMPTY",
    baseline_weight: null,
    loaded_at: null,
    filled_at: null,
    filled_by: null,
    comment: "",
    configured_at: new Date().toISOString(),
    configured_by: userId,
    pending_change: true,
  });
  refreshItemStatus(db, previousItemId);
  return { ...cell };
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
    !cells.some((c) => c.status === "CONFIGURED" || c.pending_change)
  )
    throw new Error("Нет настроенных изменений для подтверждения.");
  const timestamp = new Date().toISOString();
  const today = new Date(Date.now() + 10800000).toISOString().slice(0, 10);
  const patient = db.patients.find((p) => p.id === assignment.patient_id);
  if (patient?.status !== "active")
    throw new Error("Пациент больше не активен. Заполнение не подтверждено.");
  // Validate the entire configuration before changing any cell.
  for (const cell of cells) {
    if (cell.status === "EMPTY") continue;
    const item = db.prescriptionItems.find(
      (i) => i.id === cell.prescription_item_id,
    );
    const prescription = db.prescriptions.find(
      (p) => p.id === item?.prescription_id,
    );
    if (
      !item ||
      prescription?.patient_id !== assignment.patient_id ||
      ["paused", "completed"].includes(item.status) ||
      (item.end_date && item.end_date < today)
    ) {
      throw new Error(
        `Ячейка №${cell.cell_number}: назначение недействительно или курс завершён. Проверьте настройки.`,
      );
    }
  }
  cells.forEach((c) => {
    c.pending_change = false;
    if (c.status !== "CONFIGURED") return;
    // Simulated sensor measurement, never derived from tablet dosage or expected weight.
    c.baseline_weight = Number((12 + c.cell_number * 0.37).toFixed(2));
    c.status = "ACTIVE";
    c.filled_by = userId;
    c.filled_at = timestamp;
    db.prescriptionItems.find((i) => i.id === c.prescription_item_id).status =
      "active";
  });
  box.status = cells.some((c) => c.status === "ACTIVE") ? "ACTIVE" : "ASSIGNED";
  const config = {
    id: nextId(db.deviceConfigs),
    pillbox_id: box.id,
    version: db.deviceConfigs.filter((c) => c.pillbox_id === box.id).length + 1,
    status: "PREPARED",
    prepared_at: timestamp,
    prepared_by: userId,
    cells: Array.from({ length: 9 }, (_, index) =>
      structuredClone(
        cells.find((cell) => cell.cell_number === index + 1) || {
          cell_number: index + 1,
          status: "EMPTY",
        },
      ),
    ),
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
  async register(input) {
    const fields = pillboxFields(input);
    if (!useMocks)
      return futureApi("/pillboxes", {
        method: "POST",
        body: JSON.stringify({ ...fields, token: input.token }),
      });
    if (
      store.pillboxes.some(
        (box) =>
          box.serial_number.toLowerCase() ===
          fields.serial_number.toLowerCase(),
      )
    )
      throw new Error(
        "Таблетница с таким серийным номером уже зарегистрирована.",
      );
    if (
      store.pillboxes.some(
        (box) => box.device_id.toLowerCase() === fields.device_id.toLowerCase(),
      )
    )
      throw new Error("Название таблетницы уже используется.");
    const timestamp = new Date().toISOString();
    // Demo validates the token but never stores or returns it.
    const box = {
      ...fields,
      id: nextId(store.pillboxes),
      last_seen_at: fields.online ? timestamp : null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    store.pillboxes.push(box);
    return structuredClone(box);
  },
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
  async clearCell(boxId, cellNumber, userId) {
    if (!useMocks)
      return futureApi(
        `/pillboxes/${Number(boxId)}/cells/${Number(cellNumber)}`,
        { method: "DELETE" },
      );
    return clearCell(store, boxId, cellNumber, userId);
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
