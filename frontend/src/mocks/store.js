import {patients} from './patients.js';
import {prescriptions, prescriptionItems, schedules} from './prescriptions.js';
import {pillboxes, assignments, configurations} from './pillboxes.js';
import {events} from './events.js';
import {alerts} from './alerts.js';
export function createStore() { return structuredClone({patients, prescriptions, prescriptionItems, schedules, pillboxes, assignments, configurations, events, alerts, deviceConfigs: []}); }
export const store = createStore();
export const nextId = (rows) => Math.max(0, ...rows.map(row => row.id)) + 1;
