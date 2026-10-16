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
    throw new Error(
      typeof body.detail === "string"
        ? body.detail
        : `Ошибка сервера (${response.status}). Повторите попытку.`,
    );
  }
  return response.status === 204 ? null : response.json();
}
export function unavailable(feature) {
  throw new Error(
    `${feature}: API ещё не реализован. Этот сценарий доступен в деморежиме (VITE_USE_MOCKS=true).`,
  );
}
