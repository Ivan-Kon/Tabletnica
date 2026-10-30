import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PageTitle,
  Card,
  Button,
  ErrorMessage,
} from "../components/common/UI.jsx";
import { patientsService } from "../services/patientsService.js";
import { pillboxesService } from "../services/pillboxesService.js";
import { useMocks } from "../services/api.js";

export default function RegistrationPage({ kind }) {
  const patient = kind === "patient";
  const base = patient ? "/patients" : "/pillboxes";
  const navigate = useNavigate();
  const [form, setForm] = useState(
    patient
      ? { full_name: "", room_number: "", bed_number: "", status: "active" }
      : {
          device_id: "",
          serial_number: "",
          model: "БП · 9 ячеек",
          status: "AVAILABLE",
          token: "",
          online: false,
        },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  function update(name, value) {
    setForm((old) => ({ ...old, [name]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const record = await (
        patient ? patientsService : pillboxesService
      ).register(form);
      navigate(`${base}/${record.id}`, {
        state: {
          notice: patient
            ? "Пациент зарегистрирован."
            : "Таблетница зарегистрирована. Ячейки готовы к настройке после передачи пациенту.",
        },
      });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  const fields = patient
    ? [
        ["full_name", "ФИО пациента", 100],
        ["room_number", "Номер палаты", 20],
        ["bed_number", "Номер койки", 20],
      ]
    : [
        ["device_id", "Название таблетницы", 50],
        ["serial_number", "Серийный номер", 50],
        ["model", "Модель", 50],
      ];
  return (
    <>
      <PageTitle
        back={base}
        title={patient ? "Регистрация пациента" : "Регистрация таблетницы"}
        description={
          patient
            ? "Укажите данные пациента и его размещение в отделении."
            : "Добавьте устройство с девятью ячейками в список отделения."
        }
      />
      <Card>
        {useMocks && (
          <p className="notice">
            Деморежим: новые записи сохраняются до обновления страницы.
          </p>
        )}
        <form onSubmit={submit}>
          <fieldset disabled={busy} className="registration-fields">
            <div className="form-grid">
              {fields.map(([name, label, max]) => (
                <label key={name}>
                  {label}
                  <input
                    required
                    maxLength={max}
                    value={form[name]}
                    onChange={(e) => update(name, e.target.value)}
                  />
                </label>
              ))}
              <label>
                Статус
                <select
                  value={form.status}
                  onChange={(e) => update("status", e.target.value)}
                >
                  {patient ? (
                    <>
                      <option value="active">Активный</option>
                      <option value="discharged">Выписан</option>
                    </>
                  ) : (
                    <>
                      <option value="AVAILABLE">Свободна</option>
                      <option value="OFFLINE">Нет связи</option>
                      <option value="MAINTENANCE">Обслуживание</option>
                      <option value="ERROR">Ошибка</option>
                    </>
                  )}
                </select>
              </label>
            </div>
            {!patient && (
              <>
                <label>
                  Токен устройства
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={16}
                    maxLength={256}
                    value={form.token}
                    onChange={(e) => update("token", e.target.value)}
                    aria-describedby="token-help"
                  />
                </label>
                <p className="field-hint" id="token-help">
                  От 16 до 256 символов без пробелов.{" "}
                  {useMocks
                    ? "Используйте тестовый токен: в деморежиме он проверяется, но не сохраняется и не привязывается к оборудованию."
                    : "Токен передаётся серверу при регистрации и не отображается в карточке."}
                </p>
                <Button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    const bytes = crypto.getRandomValues(new Uint8Array(24));
                    update(
                      "token",
                      Array.from(bytes, (byte) =>
                        byte.toString(16).padStart(2, "0"),
                      ).join(""),
                    );
                  }}
                >
                  {form.token ? "Заменить токен" : "Сгенерировать токен"}
                </Button>
                {useMocks && (
                  <label className="checkbox registration-connection">
                    <input
                      type="checkbox"
                      checked={form.online && form.status !== "OFFLINE"}
                      disabled={form.status === "OFFLINE"}
                      onChange={(e) => update("online", e.target.checked)}
                    />
                    Имитировать подключение устройства для демонстрации
                  </label>
                )}
                <p className="muted">
                  Статусы «Передана» и «Активна» появятся после передачи
                  пациенту и подтверждения заполнения.
                </p>
              </>
            )}
          </fieldset>
          <ErrorMessage error={error} />
          <div className="form-actions">
            <Link className="button secondary" to={base}>
              Отмена
            </Link>
            <Button type="submit" loading={busy}>
              Зарегистрировать
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
