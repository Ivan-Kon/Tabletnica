import { useState } from "react";
import { Link } from "react-router-dom";
import { TriangleAlert, WifiOff, Check } from "lucide-react";
import {
  PageTitle,
  Card,
  Badge,
  Button,
  ErrorMessage,
  Empty,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import { alertsService } from "../services/alertsService.js";
import { patientsService } from "../services/patientsService.js";
import { pillboxesService } from "../services/pillboxesService.js";
import { formatDate } from "../services/schedule.js";
export default function AlertsPage() {
  const [filter, setFilter] = useState("new");
  const [busy, setBusy] = useState(null);
  const [actionError, setError] = useState(null);
  const { data, error, reload } = useLoad(async () => ({
    alerts: await alertsService.getAlerts(),
    patients: await patientsService.getPatients(),
    boxes: await pillboxesService.getAll(),
  }));
  async function review(id) {
    setBusy(id);
    setError(null);
    try {
      await alertsService.markReviewed(id);
      reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  }
  if (!data) return <LoadState data={data} error={error} />;
  const alerts = data.alerts.filter(
    (a) => filter === "all" || a.status === filter || a.severity === filter,
  );
  return (
    <>
      <PageTitle
        title="Уведомления"
        description="События, на которые стоит обратить внимание."
      />
      <div className="tabs" role="group" aria-label="Фильтр уведомлений">
        {[
          ["new", "Новые"],
          ["all", "Все"],
          ["error", "Ошибки"],
          ["warning", "Предупреждения"],
          ["reviewed", "Просмотренные"],
        ].map(([value, label]) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? "active" : ""}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <ErrorMessage error={actionError} />
      <div className="alerts-list">
        {alerts.map((a) => {
          const p = data.patients.find((p) => p.id === a.patient_id);
          const b = data.boxes.find((b) => b.id === a.pillbox_id);
          return (
            <Card key={a.id} className={`alert-card ${a.severity}`}>
              <div className="alert-icon">
                {a.type === "OFFLINE" ? (
                  <WifiOff size={24} />
                ) : (
                  <TriangleAlert size={24} />
                )}
              </div>
              <div className="alert-body">
                <div className="section-heading">
                  <Badge status={a.type} />
                  <time>{formatDate(a.created_at)}</time>
                </div>
                <p>{a.description}</p>
                {p ? (
                  <Link className="text-link" to={`/patients/${p.id}`}>
                    {p.full_name} · Палата {p.room_number} · Койка{" "}
                    {p.bed_number}
                  </Link>
                ) : (
                  <p className="muted">
                    Пациент не назначен · Палата и койка —
                  </p>
                )}
                {b ? (
                  <Link className="text-link" to={`/pillboxes/${b.id}`}>
                    {b.device_id} →
                  </Link>
                ) : (
                  <p className="muted">Устройство недоступно</p>
                )}
                <div className="alert-actions">
                  <Badge status={a.status}>
                    {a.status === "new" ? "Требует внимания" : "Просмотрено"}
                  </Badge>
                  {a.status === "new" && (
                    <Button
                      loading={busy === a.id}
                      className="secondary small-button"
                      onClick={() => review(a.id)}
                    >
                      <Check size={15} />
                      Отметить просмотренным
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {!alerts.length && (
        <Card>
          <Empty title="Нет уведомлений в этой категории" />
        </Card>
      )}
    </>
  );
}
