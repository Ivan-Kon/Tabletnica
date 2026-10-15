import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useOutletContext,
} from "react-router-dom";
import { Pill } from "lucide-react";
import {
  PageTitle,
  Card,
  Button,
  ErrorMessage,
  Empty,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import { pillboxesService } from "../services/pillboxesService.js";
import { prescriptionsService } from "../services/prescriptionsService.js";
import { localDateTime, scheduleLabel } from "../services/schedule.js";
export default function CellConfigurationPage() {
  const { id, cell } = useParams();
  const { user } = useOutletContext();
  const { data, error } = useLoad(async () => {
    const box = await pillboxesService.getPillbox(id);
    if (!box.assignment)
      throw new Error("Сначала передайте таблетницу пациенту.");
    if (!/^[1-9]$/.test(cell)) throw new Error("Неверный номер ячейки.");
    const items = await prescriptionsService.getPatientPrescriptions(
      box.patient.id,
    );
    return {
      box,
      items: items.filter(
        (i) =>
          !["paused", "completed"].includes(i.status) &&
          (!i.end_date || i.end_date >= localDateTime().slice(0, 10)),
      ),
    };
  }, [id, cell]);
  if (!data) return <LoadState data={data} error={error} />;
  return <CellForm key={`${id}-${cell}`} data={data} cell={cell} user={user} />;
}
function CellForm({ data, cell, user }) {
  const { box, items } = data;
  const navigate = useNavigate();
  const existing = box.cells.find((c) => c.cell_number === Number(cell));
  const [selected, setSelected] = useState(existing.prescription_item_id || "");
  const [loaded, setLoaded] = useState(localDateTime());
  const [comment, setComment] = useState(existing.comment || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const item = items.find((i) => i.id === Number(selected));
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await pillboxesService.configureCell(
        box.id,
        Number(cell),
        selected,
        `${loaded}:00+03:00`,
        comment,
        user.id,
      );
      navigate(`/pillboxes/${box.id}`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        back={`/pillboxes/${box.id}`}
        title={`Настройка ячейки №${cell}`}
        description={`${box.device_id} · ${box.patient.full_name}`}
      />
      {!items.length ? (
        <Card>
          <Empty title="Нет действующих назначений">
            <Link
              className="button"
              to={`/patients/${box.patient.id}/prescriptions/new`}
            >
              Добавить назначение
            </Link>
          </Empty>
        </Card>
      ) : (
        <form onSubmit={save}>
          <div className="detail-columns">
            <Card>
              <h2>Связать с назначением</h2>
              <label>
                Назначение пациента
                <select
                  required
                  disabled={busy}
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">Выберите назначение</option>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.drug_name} · {i.dosage} · {i.quantity} табл.
                    </option>
                  ))}
                </select>
              </label>
              <div className="notice">
                Дозировка и количество берутся из назначения. Повторный ввод не
                требуется.
              </div>
              {item && (
                <dl className="definition-list">
                  <dt>Препарат</dt>
                  <dd>{item.drug_name}</dd>
                  <dt>Дозировка</dt>
                  <dd>{item.dosage}</dd>
                  <dt>Количество</dt>
                  <dd>{item.quantity} табл.</dd>
                  <dt>Расписание</dt>
                  <dd>{scheduleLabel(item.schedule)}</dd>
                  <dt>Период</dt>
                  <dd>
                    {item.start_date} — {item.end_date || "без ограничения"}
                  </dd>
                </dl>
              )}
              <label>
                Дата и время заполнения · МСК
                <input
                  type="datetime-local"
                  required
                  max={localDateTime()}
                  value={loaded}
                  onChange={(e) => setLoaded(e.target.value)}
                />
              </label>
              <label>
                Комментарий
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  placeholder="Например, препарат в части блистера"
                />
              </label>
            </Card>
            <Card className="cell-preview">
              <span className="eyebrow">ПРЕДПРОСМОТР</span>
              <div className="preview-pill">
                <Pill size={40} />
              </div>
              <h2>Ячейка №{cell}</h2>
              <h3>{item?.drug_name || "Выберите назначение"}</h3>
              {item && (
                <>
                  <p>
                    {item.dosage} · {item.quantity} табл.
                  </p>
                  <p>{scheduleLabel(item.schedule)}</p>
                </>
              )}
              <div className="notice">
                После сохранения проверьте все ячейки и подтвердите заполнение
                таблетницы.
              </div>
              <p className="field-hint">
                Исходный вес определяется датчиком после заполнения, а не
                рассчитывается по весу таблетки.
              </p>
            </Card>
          </div>
          <ErrorMessage error={error} />
          <div className="form-actions">
            <Link className="button secondary" to={`/pillboxes/${box.id}`}>
              Отмена
            </Link>
            <Button
              type="submit"
              loading={busy}
              disabled={!item || !box.online}
            >
              Сохранить ячейку
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
