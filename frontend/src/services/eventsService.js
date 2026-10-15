import {store} from '../mocks/store.js';
import {useMocks, unavailable} from './api.js';
export const eventsService = {async getEvents(patientId) { if (!useMocks) return unavailable('История событий'); return structuredClone(store.events.filter(e => !patientId || e.patient_id === Number(patientId)).sort((a,b) => new Date(b.occurred_at)-new Date(a.occurred_at))); }};
