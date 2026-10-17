import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PageTitle,
  Card,
  Badge,
  Empty,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import { prescriptionsService } from "../services/prescriptionsService.js";
import { patientsService } from "../services/patientsService.js";
import { scheduleLabel } from "../services/schedule.js";
export default function PrescriptionsPage() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const { data, error } = useLoad(async () => ({
    items: await prescriptionsService.getAll(),
    patients: await patientsService.getPatients(),
  }));
  if (!data) return <LoadState data={data} error={error} />;
  const items = data.items.filter(
    (i) =>
      (filter === "all" ||
        (filter === "setup"
          ? ["new", "pending_setup", "configured"].includes(i.status)
          : i.status === filter)) &&
      `${i.drug_name} ${data.patients.find((p) => p.id === i.prescription.patient_id)?.full_name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Назначения"
        description="Цифровые копии бумажных назначений. Внесены медсестрой."
        action={
          <Link className="button" to="/patients">
            Выбрать пациента
          </Link>
        }
      />
      <Card>
        <div className="toolbar">
          <input
            aria-label="Поиск назначения"
            placeholder="Пациент или препарат"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            aria-label="Статус назначения"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Все назначения</option>
            <option value="setup">Требуют настройки</option>
            <option value="active">Активные</option>
            <option value="completed">Завершённые</option>
          </select>
        </div>
        {items.map((item) => {
          const p = data.patients.find(
            (p) => p.id === item.prescription.patient_id,
          );
          return (
            <article className="appointment" key={item.id}>
              <div>
                <Link className="text-link" to={`/patients/${p.id}`}>
                  {p.full_name}
                </Link>
                <p className="muted">
                  Палата {p.room_number} · Койка {p.bed_number}
                </p>
              </div>
              <div>
                <strong>{item.drug_name}</strong>
                <p>
                  {item.dosage} · {item.quantity} табл.
                </p>
                <small>{scheduleLabel(item.schedule)}</small>
              </div>
              <Badge status={item.status} />
              <Link
                className="button secondary small-button"
                to={`/patients/${p.id}`}
              >
                Открыть
              </Link>
            </article>
          );
        })}
        {!items.length && <Empty title="Назначения не найдены" />}
      </Card>
    </>
  );
}
