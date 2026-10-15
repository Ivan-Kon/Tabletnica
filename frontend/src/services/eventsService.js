import { store } from "../mocks/store.js";
import { useMocks } from "./api.js";
import { futureApi } from "./futureApi.js";
export const eventsService = {
  async getEvents(patientId) {
    if (!useMocks)
      return futureApi(
        `/events${patientId ? `?patient_id=${Number(patientId)}` : ""}`,
      );
    return structuredClone(
      store.events
        .filter((e) => !patientId || e.patient_id === Number(patientId))
        .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at)),
    );
  },
};
