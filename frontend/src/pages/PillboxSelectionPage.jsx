import { useState } from "react";
import {
  Link,
  useParams,
  useNavigate,
  useOutletContext,
} from "react-router-dom";
import { Pill, CheckCircle2 } from "lucide-react";
import {
  PageTitle,
  Card,
  Badge,
  Button,
  PatientSummary,
  ErrorMessage,
  Empty,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import { pillboxesService } from "../services/pillboxesService.js";
import { patientsService } from "../services/patientsService.js";
import { formatDate } from "../services/schedule.js";
export default function PillboxSelectionPage() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { data, error: loadError } = useLoad(
    async () => ({
      patient: await patientsService.getPatient(id),
      boxes: await pillboxesService.getAvailablePillboxes(),
      assigned: await pillboxesService.getPatientPillbox(id),
    }),
    [id],
  );
  async function assign() {
    setBusy(true);
    setError(null);
    try {
      await pillboxesService.assignPillbox(selected, id, user.id);
      navigate(`/pillboxes/${selected}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (!data) return <LoadState data={data} error={loadError} />;
  return (
    <>
      <PageTitle
        title="Передача таблетницы"
        back={`/patients/${id}`}
        description="Выберите свободное устройство и подтвердите передачу пациенту."
      />
      <Card className="patient-banner">
        <PatientSummary patient={data.patient} />
      </Card>
      {data.assigned ? (
        <Card>
          <p>У пациента уже есть {data.assigned.device_id}.</p>
          <Link className="button" to={`/pillboxes/${data.assigned.id}`}>
            Открыть таблетницу
          </Link>
        </Card>
      ) : (
        <>
          <div className="section-heading">
            <h2>
              Свободные устройства{" "}
              <span className="count">{data.boxes.length}</span>
            </h2>
          </div>
          <div className="device-selection">
            {data.boxes.map((box) => (
              <button
                aria-pressed={selected === box.id}
                disabled={busy}
                key={box.id}
                className={`device-option ${selected === box.id ? "selected" : ""}`}
                onClick={() => setSelected(box.id)}
              >
                <div className="device-emblem">
                  <Pill size={30} />
                </div>
                <div>
                  <strong>{box.device_id}</strong>
                  <p>{box.serial_number}</p>
                  <small>{box.model}</small>
                  <p className="muted">
                    Последняя связь: {formatDate(box.last_seen_at)}
                  </p>
                </div>
                <Badge status={box.status} />
                {selected === box.id ? (
                  <CheckCircle2 size={23} />
                ) : (
                  <span className="selection-circle" />
                )}
              </button>
            ))}
          </div>
          {!data.boxes.length && <Empty title="Нет свободных таблетниц" />}
          <ErrorMessage error={error} />
          <div className="form-actions">
            <Link className="button secondary" to={`/patients/${id}`}>
              Отмена
            </Link>
            <Button disabled={!selected} loading={busy} onClick={assign}>
              Передать пациенту
            </Button>
          </div>
        </>
      )}
    </>
  );
}
