import { store, nextId } from "../mocks/store.js";
import { api, useMocks } from "./api.js";
import { patientFields } from "./registration.js";
export const patientsService = {
  async register(input) {
    const fields = patientFields(input);
    if (!useMocks)
      return api("/patients/add", {
        method: "POST",
        body: JSON.stringify(fields),
      });
    if (
      fields.status === "active" &&
      store.patients.some(
        (patient) =>
          patient.status === "active" &&
          patient.room_number.toLowerCase() ===
            fields.room_number.toLowerCase() &&
          patient.bed_number.toLowerCase() === fields.bed_number.toLowerCase(),
      )
    )
      throw new Error("Эта койка уже занята активным пациентом.");
    const timestamp = new Date().toISOString();
    const patient = {
      ...fields,
      id: nextId(store.patients),
      created_at: timestamp,
      updated_at: timestamp,
    };
    store.patients.push(patient);
    return structuredClone(patient);
  },
  async getPatients() {
    return useMocks
      ? structuredClone(store.patients)
      : api("/patients/get_all");
  },
  async getPatient(id) {
    if (!useMocks) return api(`/patients/get/${id}`);
    const patient = store.patients.find((p) => p.id === Number(id));
    if (!patient) throw new Error("Пациент не найден.");
    return { ...patient };
  },
};
