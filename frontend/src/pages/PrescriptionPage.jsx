import { useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { Plus, FileText, Trash2 } from "lucide-react";
import {
  PageTitle,
  Card,
  Button,
  ErrorMessage,
  PatientSummary,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import DrugInput from "../components/prescriptions/DrugInput.jsx";
import ScheduleFields from "../components/prescriptions/ScheduleFields.jsx";
import { patientsService } from "../services/patientsService.js";
import { prescriptionsService } from "../services/prescriptionsService.js";
import { localDateTime } from "../services/schedule.js";
const blankItem = () => ({
  drug_name: "",
  dosage: "",
  quantity: 1,
  start_date: localDateTime().slice(0, 10),
  end_date: "",
  comment: "",
  schedule: {
    schedule_type: "SPECIFIC_TIME",
    specific_times: ["08:00"],
    interval_minutes: 360,
    anchor_at: `${localDateTime().slice(0, 10)}T21:30:00+03:00`,
  },
});
export default function PrescriptionPage() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState("");
  const [items, setItems] = useState([blankItem()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { data: patient, error: loadError } = useLoad(
    () => patientsService.getPatient(id),
    [id],
  );
  const update = (index, patch) =>
    setItems((values) =>
      values.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  async function save(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await prescriptionsService.addPrescription(id, doctor, items, user.id);
      navigate(`/patients/${id}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  if (!patient) return <LoadState data={patient} error={loadError} />;
  if (patient.status !== "active")
    return (
      <ErrorMessage error="Новые назначения доступны только активным пациентам." />
    );
  return (
    <>
      <PageTitle
        back={`/patients/${id}`}
        title="Перенос назначения"
        description="Внесите данные из бумажного листа врача."
      />
      <Card className="patient-banner">
        <PatientSummary patient={patient} />
        <span className="document-tag">
          <FileText size={17} />
          Бумажный лист
        </span>
      </Card>
      <form onSubmit={save} className="prescription-form">
        <fieldset disabled={busy}>
          <Card>
            <h2>Данные назначения</h2>
            <label>
              ФИО врача
              <input
                required
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                placeholder="Фамилия Имя Отчество"
                maxLength={255}
              />
            </label>
            <p className="field-hint">
              Переносит: {user.full_name}. Автор и время сохраняются
              автоматически.
            </p>
          </Card>
          {items.map((item, index) => (
            <Card key={index}>
              <div className="section-heading">
                <h2>Препарат {index + 1}</h2>
                {items.length > 1 && (
                  <Button
                    type="button"
                    className="ghost danger-text"
                    onClick={() =>
                      setItems((values) => values.filter((_, i) => i !== index))
                    }
                  >
                    <Trash2 size={16} />
                    Удалить
                  </Button>
                )}
              </div>
              <DrugInput
                id={`drug-${index}`}
                value={item.drug_name}
                onChange={(value) => update(index, { drug_name: value })}
              />
              <div className="form-grid">
                <label>
                  Дозировка
                  <input
                    required
                    value={item.dosage}
                    onChange={(e) => update(index, { dosage: e.target.value })}
                    placeholder="Например, 100 мг"
                  />
                </label>
                <label>
                  Количество таблеток
                  <input
                    required
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={item.quantity}
                    onChange={(e) =>
                      update(index, { quantity: e.target.value })
                    }
                  />
                </label>
                <label>
                  Дата начала
                  <input
                    required
                    type="date"
                    value={item.start_date}
                    onChange={(e) =>
                      update(index, { start_date: e.target.value })
                    }
                  />
                </label>
                <label>
                  Дата окончания
                  <input
                    type="date"
                    min={item.start_date}
                    value={item.end_date}
                    onChange={(e) =>
                      update(index, { end_date: e.target.value })
                    }
                  />
                  <span className="field-hint">
                    Оставьте пустой, если не указана
                  </span>
                </label>
              </div>
              <ScheduleFields
                value={item.schedule}
                onChange={(schedule) => update(index, { schedule })}
                index={index}
              />
              <label>
                Комментарий <span className="muted">· необязательно</span>
                <textarea
                  value={item.comment}
                  onChange={(e) => update(index, { comment: e.target.value })}
                  placeholder="Дополнительные указания из листа"
                  maxLength={1000}
                />
              </label>
            </Card>
          ))}
          <Button
            type="button"
            className="secondary"
            onClick={() => setItems((values) => [...values, blankItem()])}
          >
            <Plus size={17} />
            Ещё препарат в этот лист
          </Button>
        </fieldset>
        <ErrorMessage error={error} />
        <div className="form-actions">
          <Link className="button secondary" to={`/patients/${id}`}>
            Отмена
          </Link>
          <Button type="submit" loading={busy}>
            Сохранить назначение
          </Button>
        </div>
      </form>
    </>
  );
}
