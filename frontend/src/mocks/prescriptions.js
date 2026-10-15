export const prescriptions = [
  {id: 1, patient_id: 1, doctor_name: 'Кузнецова Елена Михайловна', entered_by: 1, source_type: 'paper', created_at: '2026-10-15T07:30:00+03:00'},
  {id: 2, patient_id: 2, doctor_name: 'Петров Дмитрий Игоревич', entered_by: 1, source_type: 'paper', created_at: '2026-10-15T07:45:00+03:00'},
  {id: 3, patient_id: 3, doctor_name: 'Кузнецова Елена Михайловна', entered_by: 1, source_type: 'paper', created_at: '2026-10-15T08:00:00+03:00'}
];
export const prescriptionItems = [
  {id: 1, prescription_id: 1, drug_name: 'Аскорбиновая кислота', dosage: '100 мг', quantity: 1, dosage_form: 'таблетка', start_date: '2026-10-15', end_date: '2026-10-22', status: 'new'},
  {id: 2, prescription_id: 2, drug_name: 'Метформин', dosage: '500 мг', quantity: 1, dosage_form: 'таблетка', start_date: '2026-10-12', end_date: '2026-10-30', status: 'active'},
  {id: 3, prescription_id: 2, drug_name: 'Омепразол', dosage: '20 мг', quantity: 1, dosage_form: 'таблетка', start_date: '2026-10-12', end_date: '2026-10-30', status: 'active'},
  {id: 4, prescription_id: 3, drug_name: 'Аторвастатин', dosage: '10 мг', quantity: 1, dosage_form: 'таблетка', start_date: '2026-10-15', end_date: '2026-10-30', status: 'pending_setup'}
];
export const schedules = [
  {id: 1, prescription_item_id: 1, schedule_type: 'INTERVAL', interval_minutes: 360, anchor_at: '2026-10-15T21:30:00+03:00'},
  {id: 2, prescription_item_id: 2, schedule_type: 'SPECIFIC_TIME', specific_times: ['08:00', '20:00']},
  {id: 3, prescription_item_id: 3, schedule_type: 'INTERVAL', interval_minutes: 720, anchor_at: '2026-10-12T09:00:00+03:00'},
  {id: 4, prescription_item_id: 4, schedule_type: 'SPECIFIC_TIME', specific_times: ['18:00', '22:00']}
];
