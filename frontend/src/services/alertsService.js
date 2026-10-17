import { store } from "../mocks/store.js";
import { useMocks, api } from "./api.js";
import { futureApi } from "./futureApi.js";
export const alertsService = {
  async getAlerts() {
    if (!useMocks) return api("/alerts/get_all");
    return structuredClone(store.alerts);
  },
  async markReviewed(id) {
    if (!useMocks)
      return futureApi(`/alerts/${Number(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "reviewed" }),
      });
    const alert = store.alerts.find((a) => a.id === Number(id));
    if (!alert) throw new Error("Уведомление не найдено.");
    alert.status = "reviewed";
  },
};
