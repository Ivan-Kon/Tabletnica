import {store} from '../mocks/store.js';
import {useMocks, unavailable} from './api.js';
export const alertsService = {
  async getAlerts() { if (!useMocks) return unavailable('Уведомления'); return structuredClone(store.alerts); },
  async markReviewed(id) { if (!useMocks) return unavailable('Обработка уведомления'); const alert = store.alerts.find(a => a.id === Number(id)); if (!alert) throw new Error('Уведомление не найдено.'); alert.status = 'reviewed'; }
};
