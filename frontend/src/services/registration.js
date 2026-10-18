export function requiredText(value, label, max) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > max)
    throw new Error(`${label}: заполните поле (до ${max} символов).`);
  return text;
}

export function patientFields(input) {
  const fields = {
    full_name: requiredText(input.full_name, "ФИО", 100),
    room_number: requiredText(input.room_number, "Номер палаты", 20),
    bed_number: requiredText(input.bed_number, "Номер койки", 20),
    status: input.status,
  };
  if (!["active", "discharged"].includes(fields.status))
    throw new Error("Выберите статус пациента.");
  return fields;
}

export function pillboxFields(input) {
  const fields = {
    device_id: requiredText(input.device_id, "Название", 50),
    serial_number: requiredText(input.serial_number, "Серийный номер", 50),
    model: requiredText(input.model, "Модель", 50),
    status: input.status,
  };
  if (!["AVAILABLE", "OFFLINE", "MAINTENANCE", "ERROR"].includes(fields.status))
    throw new Error("Новое устройство не может быть переданным или активным.");
  if (typeof input.token !== "string" || !/^\S{16,256}$/.test(input.token))
    throw new Error(
      "Токен должен содержать от 16 до 256 символов без пробелов.",
    );
  // Connection is simulated explicitly in demo; registering is not a device heartbeat.
  return {
    ...fields,
    online: fields.status !== "OFFLINE" && input.online === true,
  };
}
