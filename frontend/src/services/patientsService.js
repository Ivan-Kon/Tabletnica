import { store } from "../mocks/store.js";
import { api, useMocks } from "./api.js";
export const patientsService = {
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
