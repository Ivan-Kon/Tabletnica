export const useMocks = import.meta.env?.VITE_USE_MOCKS !== "false";
const baseUrl = import.meta.env?.VITE_API_BASE_URL || "http://localhost:8000";
export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Не удалось связаться с сервером. Проверьте подключение и повторите попытку.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const fields = {
      doctor_name: "ФИО врача",
      prescribed_by: "ФИО врача",
      patient_id: "Пациент",
      items: "Препараты",
      drug_name: "Название препарата",
      dosage: "Дозировка",
      quantity: "Количество",
      start_date: "Дата начала",
      end_date: "Дата окончания",
      schedule: "Расписание",
      specific_times: "Время выдачи",
      interval_minutes: "Интервал",
      anchor_at: "Начало отсчёта",
    };
    const validation = Array.isArray(body.detail)
      ? body.detail
          .map((issue) => {
            const path = (issue.loc || [])
              .filter((part) => part !== "body")
              .map((part) =>
                typeof part === "number"
                  ? `№${part + 1}`
                  : fields[part] || part,
              )
              .join(" → ");
            return `${path ? `${path}: ` : ""}${issue.msg || "Проверьте значение"}`;
          })
          .join("; ")
      : null;
    const error = new Error(
      typeof body.detail === "string"
        ? body.detail
        : validation ||
            `Ошибка сервера (${response.status}). Повторите попытку.`,
    );
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
export function unavailable(feature) {
  throw new Error(
    `${feature}: API ещё не реализован. Этот сценарий доступен в деморежиме (VITE_USE_MOCKS=true).`,
  );
}
