import { store, nextId } from "../mocks/store.js";
import { useMocks } from "./api.js";
import { futureApi } from "./futureApi.js";
export function getItems(db = store) {
  return db.prescriptionItems.map((item) => ({
    ...item,
    ...{
      prescription: db.prescriptions.find((p) => p.id === item.prescription_id),
      schedule: db.schedules.find((s) => s.prescription_item_id === item.id),
    },
  }));
}
export function validateItem(item) {
  if (
    !item.drug_name?.trim() ||
    !item.dosage?.trim() ||
    !(Number(item.quantity) > 0) ||
    !Number.isFinite(Number(item.quantity))
  )
    throw new Error("Укажите препарат, дозировку и положительное количество.");
  if (!item.start_date || (item.end_date && item.end_date < item.start_date))
    throw new Error("Дата окончания должна быть не раньше даты начала.");
  if (
    !item.schedule ||
    !["SPECIFIC_TIME", "INTERVAL"].includes(item.schedule.schedule_type)
  )
    throw new Error("Выберите тип расписания.");
  if (item.schedule.schedule_type === "SPECIFIC_TIME") {
    const times = item.schedule.specific_times;
    if (
      !Array.isArray(times) ||
      !times.length ||
      times.some((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) ||
      new Set(times).size !== times.length
    )
      throw new Error("Укажите различные корректные времена.");
  } else if (
    !(item.schedule.interval_minutes > 0) ||
    !Number.isFinite(item.schedule.interval_minutes) ||
    !Number.isFinite(new Date(item.schedule.anchor_at).getTime())
  )
    throw new Error("Укажите интервал и точку отсчёта.");
}
export const prescriptionsService = {
  async getAll() {
    if (!useMocks) return futureApi("/prescription-items");
    return structuredClone(getItems());
  },
  async getPatientPrescriptions(id) {
    return (await this.getAll()).filter(
      (i) => i.prescription.patient_id === Number(id),
    );
  },
  async addPrescription(patientId, doctorName, items, userId) {
    if (!doctorName.trim()) throw new Error("Укажите ФИО врача.");
    if (!items.length) throw new Error("Добавьте хотя бы один препарат.");
    items.forEach(validateItem);
    if (!useMocks)
      return futureApi("/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          patient_id: Number(patientId),
          doctor_name: doctorName,
          items,
        }),
      });
    const prescription = {
      id: nextId(store.prescriptions),
      patient_id: Number(patientId),
      doctor_name: doctorName.trim(),
      entered_by: userId,
      source_type: "paper",
      created_at: new Date().toISOString(),
    };
    store.prescriptions.push(prescription);
    for (const value of items) {
      const { schedule, ...fields } = value;
      const item = {
        ...fields,
        drug_name: fields.drug_name.trim(),
        dosage: fields.dosage.trim(),
        quantity: Number(fields.quantity),
        id: nextId(store.prescriptionItems),
        prescription_id: prescription.id,
        status: "new",
        dosage_form: "таблетка",
      };
      store.prescriptionItems.push(item);
      store.schedules.push({
        ...schedule,
        id: nextId(store.schedules),
        prescription_item_id: item.id,
      });
    }
    return { ...prescription };
  },
};
