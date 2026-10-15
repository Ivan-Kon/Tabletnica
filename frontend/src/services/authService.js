import { users } from "../mocks/users.js";
import { api, useMocks, unavailable } from "./api.js";
let currentUser = null;
export const authService = {
  current: () => currentUser,
  async login(username, password) {
    if (!useMocks) {
      await api("/users/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      return unavailable("Безопасная cookie-сессия входа");
    }
    if (username !== "nurse" || password !== "demo123")
      throw new Error("Неверный логин или пароль. Демо: nurse / demo123.");
    currentUser = { ...users[0] };
    return currentUser;
  },
  async logout() {
    currentUser = null;
  },
};
