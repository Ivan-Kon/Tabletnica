import { Link, useParams } from "react-router-dom";
import { Check, Wifi, WifiOff } from "lucide-react";
import {
  PageTitle,
  Card,
  Badge,
  PatientSummary,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import CellGrid from "../components/pillboxes/CellGrid.jsx";
import { pillboxesService } from "../services/pillboxesService.js";
import { formatDate } from "../services/schedule.js";
export default function PillboxPage() {
  const { id } = useParams();
  const { data: box, error } = useLoad(
    () => pillboxesService.getPillbox(id),
    [id],
  );
  if (!box) return <LoadState data={box} error={error} />;
  return (
    <>
      <PageTitle
        back="/pillboxes"
        title={box.device_id}
        description={`S/N: ${box.serial_number} · ${box.model}`}
        action={<Badge status={box.status} />}
      />
      <div className="device-overview">
        <Card>
          {box.patient ? (
            <>
              <PatientSummary patient={box.patient} />
              <Link className="text-link" to={`/patients/${box.patient.id}`}>
                Карточка пациента →
              </Link>
              <p className="muted">
                Передана {formatDate(box.assignment.assigned_at)}
              </p>
            </>
          ) : (
            <>
              <h2>Устройство не передано</h2>
              <p className="muted">Для настройки сначала выберите пациента.</p>
              <Link className="text-link" to="/patients">
                К списку пациентов →
              </Link>
            </>
          )}
        </Card>
        <Card>
          <div className={`connection ${box.online ? "online" : "offline"}`}>
            {box.online ? <Wifi size={20} /> : <WifiOff size={20} />}{" "}
            {box.online ? "В сети" : "Нет связи"}
          </div>
          <p className="muted">
            Последняя связь
            <br />
            <strong>{formatDate(box.last_seen_at)}</strong>
          </p>
          {box.latestConfig && (
            <small>
              Конфигурация v{box.latestConfig.version} подготовлена · деморежим
            </small>
          )}
        </Card>
      </div>
      <Card>
        <div className="section-heading">
          <div>
            <h2>Ячейки таблетницы</h2>
            <p className="muted">
              Выберите ячейку, чтобы связать её с назначением
            </p>
          </div>
          <span className="count">
            {box.cells.filter((c) => c.status !== "EMPTY").length} из 9
          </span>
        </div>
        <CellGrid box={box} />
        <div className="cell-legend">
          <span>
            <i className="legend-dot green" />
            Активна
          </span>
          <span>
            <i className="legend-dot blue" />
            Настроена
          </span>
          <span>
            <i className="legend-dot gray" />
            Пусто
          </span>
        </div>
        {box.assignment && (
          <div className="form-actions">
            <Link className="button" to={`/pillboxes/${id}/filling`}>
              <Check size={17} />
              Проверить заполнение
            </Link>
          </div>
        )}
      </Card>
    </>
  );
}
