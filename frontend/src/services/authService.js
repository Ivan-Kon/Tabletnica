import { users } from "../mocks/users.js";
import { api, useMocks } from "./api.js";
let currentUser = null;
export const authService = {
  current: () => currentUser,
  async login(username, password) {
    if (!useMocks) {
      currentUser = await api("/users/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      return currentUser;
    }
    if (username !== "nurse" || password !== "demo123")
      throw new Error("Неверный логин или пароль. Демо: nurse / demo123.");
    currentUser = { ...users[0] };
    return currentUser;
  },
  async restore() {
    if (useMocks) return currentUser;
    try { currentUser = await api("/users/me"); }
    catch (error) { currentUser = null; if (error.status !== 401) throw error; }
    return currentUser;
  },
  async logout() {
    if (!useMocks) await api("/users/logout", { method: "POST" });
    currentUser = null;
  },
};
