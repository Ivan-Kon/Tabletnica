export const alerts = [
  {id: 1, type: 'NOT_COLLECTED', patient_id: 2, pillbox_id: 4, created_at: '2026-10-15T09:15:00+03:00', severity: 'warning', status: 'new', description: 'Омепразол, ячейка №2. Изменение веса не зафиксировано.'},
  {id: 2, type: 'OFFLINE', patient_id: null, pillbox_id: 9, created_at: '2026-10-15T08:40:00+03:00', severity: 'error', status: 'new', description: 'Нет связи с устройством. Проверьте питание и Wi-Fi.'},
  {id: 3, type: 'WEIGHT_ERROR', patient_id: 2, pillbox_id: 4, created_at: '2026-10-14T14:00:00+03:00', severity: 'error', status: 'reviewed', description: 'Нестабильные показания датчика ячейки №7.'}
];
