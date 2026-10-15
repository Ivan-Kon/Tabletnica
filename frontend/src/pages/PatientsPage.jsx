import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowUpRight } from "lucide-react";
import {
  PageTitle,
  Card,
  Badge,
  Empty,
  PatientSummary,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import { patientsService } from "../services/patientsService.js";
import { pillboxesService } from "../services/pillboxesService.js";
export default function PatientsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const { data, error } = useLoad(async () => ({
    patients: await patientsService.getPatients(),
    boxes: await pillboxesService.getAll(),
  }));
  if (!data) return <LoadState data={data} error={error} />;
  const patients = data.patients.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      `${p.full_name} ${p.room_number} ${p.bed_number}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        eyebrow="ОТДЕЛЕНИЕ"
        title="Пациенты"
        description="Назначения, таблетницы и события каждого пациента."
      />
      <Card>
        <div className="toolbar">
          <label className="search">
            <Search size={19} />
            <input
              aria-label="Поиск пациента"
              placeholder="ФИО, палата или койка"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Статус пациента"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="discharged">Выписанные</option>
          </select>
          <span className="muted">Найдено: {patients.length}</span>
        </div>
        <div className="patient-table">
          <div className="table-head">
            <span>Пациент</span>
            <span>Статус</span>
            <span>Таблетница</span>
            <span />
          </div>
          {patients.map((p) => {
            const box = data.boxes.find(
              (b) => b.assignment?.patient_id === p.id,
            );
            return (
              <Link
                className="patient-table-row"
                key={p.id}
                to={`/patients/${p.id}`}
              >
                <PatientSummary patient={p} />
                <Badge status={p.status} />
                <span>{box?.device_id || "Не передана"}</span>
                <ArrowUpRight size={19} />
              </Link>
            );
          })}
        </div>
        {!patients.length && (
          <Empty title="Пациенты не найдены">
            <p>Измените запрос или фильтр.</p>
          </Empty>
        )}
      </Card>
    </>
  );
}
