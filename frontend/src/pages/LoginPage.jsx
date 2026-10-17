import { useState } from "react";
import { Brand, Button, ErrorMessage } from "../components/common/UI.jsx";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { authService } from "../services/authService.js";
import { useMocks } from "../services/api.js";
export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onLogin(await authService.login(username, password));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <div className="login-panel">
        <Brand />
        <div className="login-form">
          <div className="eyebrow">РАБОЧЕЕ МЕСТО МЕДСЕСТРЫ</div>
          <h1>С заботой о каждом</h1>
          <p className="muted">
            Войдите, чтобы управлять назначениями
            <br />и следить за работой таблетниц.
          </p>
          <form onSubmit={submit}>
            <label>
              Логин
              <input
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Введите логин"
              />
            </label>
            <label>
              Пароль
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Введите пароль"
              />
            </label>
            <ErrorMessage error={error} />
            <Button loading={busy} type="submit">
              Войти в систему
              <ArrowRight size={18} />
            </Button>
          </form>
          {useMocks && (
            <div className="notice">
              <strong>Знакомство с системой</strong>
              <p>
                Демо-логин: <b>nurse</b> · пароль: <b>demo123</b>
              </p>
            </div>
          )}
        </div>
        <div className="muted login-footer">
          <ShieldCheck size={17} />
          Помогаем заботиться о пациентах
        </div>
      </div>
      <div className="login-visual">
        <img src="/pillbox.png" alt="Умная таблетница с девятью ячейками" />
        <div>
          <h2>
            Меньше рутины.
            <br />
            Больше времени для людей.
          </h2>
          <p>Назначения, устройства и события — в одном месте.</p>
        </div>
      </div>
    </div>
  );
}
