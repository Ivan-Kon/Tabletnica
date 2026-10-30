import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  PageTitle,
  Card,
  Badge,
  Empty,
  PatientSummary,
  useLoad,
  LoadState,
  ErrorMessage,
  Button,
} from "../components/common/UI.jsx";
import { patientsService } from "../services/patientsService.js";
import { prescriptionsService } from "../services/prescriptionsService.js";
import { eventsService } from "../services/eventsService.js";
import { formatDate } from "../services/schedule.js";
export default function HistoryPage() {
  const { id } = useParams();
  const [type, setType] = useState("all");
  const [cell, setCell] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const { data, error } = useLoad(
    async () => ({
      patient: await patientsService.getPatient(id),
      items: await prescriptionsService.getPatientPrescriptions(id),
      events: await eventsService.getEvents(id),
    }),
    [id],
  );
  if (!data) return <LoadState data={data} error={error} />;
  const events = data.events.filter(
    (e) =>
      (type === "all" || e.type === type) &&
      (cell === "all" || e.cell_number === Number(cell)) &&
      (!from ||
        new Date(e.occurred_at) >= new Date(`${from}T00:00:00+03:00`)) &&
      (!to || new Date(e.occurred_at) <= new Date(`${to}T23:59:59+03:00`)),
  );
  return (
    <>
      <PageTitle
        back={`/patients/${id}`}
        title="История событий"
        description="Датчик фиксирует изменение содержимого ячейки, а не факт проглатывания препарата."
      />
      <Card className="patient-banner">
        <PatientSummary patient={data.patient} />
      </Card>
      <Card>
        <div className="history-filters">
          <label>
            С даты
            <input
              type="date"
              value={from}
              onInput={(e) => setFrom(e.target.value)}
            />
          </label>
          <label>
            По дату
            <input
              type="date"
              min={from}
              value={to}
              onInput={(e) => setTo(e.target.value)}
            />
          </label>
          <label>
            Ячейка
            <select value={cell} onChange={(e) => setCell(e.target.value)}>
              <option value="all">Все ячейки</option>
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i} value={i + 1}>
                  Ячейка {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label>
            Событие
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">Все события</option>
              <option value="COLLECTED">Препарат забран</option>
              <option value="NOT_COLLECTED">Препарат не забран</option>
              <option value="CONFIG_PREPARED">Конфигурация подготовлена</option>
            </select>
          </label>
        </div>
        {from && to && from > to && (
          <ErrorMessage error="Дата начала периода не может быть позже даты окончания." />
        )}
        {(from || to || cell !== "all" || type !== "all") && (
          <Button
            className="secondary"
            onClick={() => {
              setFrom("");
              setTo("");
              setCell("all");
              setType("all");
            }}
          >
            Сбросить фильтры
          </Button>
        )}
        <div className="history-table">
          <div className="history-head">
            <span>Дата · время, МСК</span>
            <span>Препарат</span>
            <span>Ячейка</span>
            <span>Событие</span>
            <span>До / после / Δ, г</span>
          </div>
          {events.map((e) => (
            <article className="history-row" key={e.id}>
              <time>{formatDate(e.occurred_at)}</time>
              <strong>
                {data.items.find((i) => i.id === e.prescription_item_id)
                  ?.drug_name || "Конфигурация устройства"}
              </strong>
              <span>{e.cell_number ? `№${e.cell_number}` : "—"}</span>
              <Badge status={e.type} />
              <span className="weights">
                {e.weight_before != null
                  ? `${e.weight_before} / ${e.weight_after} / ${e.weight_delta > 0 ? "+" : ""}${e.weight_delta}`
                  : "—"}
              </span>
            </article>
          ))}
        </div>
        {!events.length && <Empty title="Событий за этот период нет" />}
      </Card>
    </>
  );
}
