import { Link } from "react-router-dom";
import {
  ClipboardList,
  Settings2,
  Pill,
  Clock3,
  TriangleAlert,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import {
  PageTitle,
  Card,
  MoreLink,
  Badge,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import { patientsService } from "../services/patientsService.js";
import { prescriptionsService } from "../services/prescriptionsService.js";
import { pillboxesService } from "../services/pillboxesService.js";
import { alertsService } from "../services/alertsService.js";
import { formatDate } from "../services/schedule.js";
export default function DashboardPage() {
  const { data, error } = useLoad(async () => {
    const [patients, items, boxes, alerts] = await Promise.all([
      patientsService.getPatients(),
      prescriptionsService.getAll(),
      pillboxesService.getAll(),
      alertsService.getAlerts(),
    ]);
    return { patients, items, boxes, alerts };
  });
  if (!data) return <LoadState data={data} error={error} />;
  const stats = [
    [
      "Новые назначения",
      data.items.filter((i) => i.status === "new").length,
      ClipboardList,
      "blue",
      "/prescriptions",
    ],
    [
      "Требуют настройки",
      data.items.filter((i) =>
        ["new", "pending_setup", "configured"].includes(i.status),
      ).length,
      Settings2,
      "amber",
      "/prescriptions",
    ],
    [
      "Активные таблетницы",
      data.boxes.filter((b) => b.status === "ACTIVE").length,
      Pill,
      "green",
      "/pillboxes",
    ],
    [
      "Препарат не забран",
      data.alerts.filter(
        (a) => a.type === "NOT_COLLECTED" && a.status === "new",
      ).length,
      Clock3,
      "orange",
      "/alerts",
    ],
    [
      "Ошибки устройств",
      data.alerts.filter((a) => a.severity === "error" && a.status === "new")
        .length,
      TriangleAlert,
      "red",
      "/alerts",
    ],
  ];
  const tasks = data.items.filter((i) =>
    ["new", "pending_setup", "configured"].includes(i.status),
  );
  return (
    <>
      <PageTitle
        eyebrow="ВАША СМЕНА"
        title="Добрый день, Анна Сергеевна"
        description="Всё, что нужно для заботы о пациентах."
        action={
          <span className="date-chip">
            <CalendarDays size={17} />
            {new Date().toLocaleDateString("ru-RU", {
              timeZone: "Europe/Moscow",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        }
      />
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">УМНАЯ ТАБЛЕТНИЦА</span>
          <h2>Забота в нужное время</h2>
          <p>
            Переносите назначения, настраивайте ячейки
            <br className="desktop-only" /> и следите за событиями в одном
            месте.
          </p>
          <Link className="button" to="/patients">
            Перейти к пациентам
            <ArrowRight size={17} />
          </Link>
        </div>
        <img
          src="/pillbox.png"
          alt="Умная таблетница: девять ячеек для препаратов"
        />
      </section>
      <div className="stats-grid">
        {stats.map(([label, value, Icon, color, to]) => (
          <Link to={to} className={`stat-card ${color}`} key={label}>
            <span className="stat-label">
              {label}
              <Icon size={20} />
            </span>
            <strong>{value}</strong>
            <span className="stat-bottom">
              Посмотреть
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <Card>
          <div className="section-heading">
            <h2>Ближайшие задачи</h2>
            <MoreLink to="/prescriptions" children="Все назначения" />
          </div>
          <div className="task-list">
            {tasks.length ? (
              tasks.map((item, index) => {
                const patient = data.patients.find(
                  (p) => p.id === item.prescription.patient_id,
                );
                return (
                  <Link
                    to={`/patients/${patient.id}`}
                    className="task"
                    key={item.id}
                  >
                    <div className="task-index">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <strong>Настроить таблетницу</strong>
                      <p>{patient.full_name}</p>
                      <small>
                        Палата {patient.room_number} · Койка{" "}
                        {patient.bed_number}
                      </small>
                    </div>
                    <ArrowRight size={18} />
                  </Link>
                );
              })
            ) : (
              <p className="muted">Все назначения настроены.</p>
            )}
          </div>
          <div className="card-footnote">
            На основе назначений, ожидающих настройки
          </div>
        </Card>
        <Card>
          <div className="section-heading">
            <h2>Требует внимания</h2>
            <MoreLink to="/alerts" />
          </div>
          {data.alerts
            .filter((a) => a.status === "new")
            .map((alert) => (
              <Link
                to="/alerts"
                className={`attention-row ${alert.severity}`}
                key={alert.id}
              >
                <span className="alert-icon">
                  <TriangleAlert size={20} />
                </span>
                <div>
                  <Badge status={alert.type} />
                  <p>
                    {
                      data.boxes.find((b) => b.id === alert.pillbox_id)
                        ?.device_id
                    }
                  </p>
                  <small>{formatDate(alert.created_at)}</small>
                </div>
                <ArrowRight size={17} />
              </Link>
            ))}
        </Card>
      </div>
      <div className="section-heading patient-heading">
        <h2>
          Пациенты отделения{" "}
          <span className="count">
            {data.patients.filter((p) => p.status === "active").length}
          </span>
        </h2>
        <MoreLink to="/patients" children="Все пациенты" />
      </div>
      <div className="patient-preview-grid">
        {data.patients
          .filter((p) => p.status === "active")
          .map((p) => (
            <Link
              to={`/patients/${p.id}`}
              className="patient-preview"
              key={p.id}
            >
              <div className="avatar">{p.full_name[0]}</div>
              <strong>{p.full_name}</strong>
              <p>
                Палата {p.room_number} · Койка {p.bed_number}
              </p>
              <span className="text-link">
                Открыть карточку
                <ArrowRight size={14} />
              </span>
            </Link>
          ))}
      </div>
    </>
  );
}
