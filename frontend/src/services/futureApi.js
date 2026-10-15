import { api } from "./api.js";

// Proposed frontend contracts, not existing FastAPI routes. See README.
// This namespace prevents accidental calls to incompatible existing endpoints.
export async function futureApi(path, options) {
  try {
    return await api(`/frontend/v1${path}`, options);
  } catch (error) {
    throw new Error(
      `Интеграция этого экрана ещё не реализована в FastAPI. ${error.message}`,
    );
  }
}
