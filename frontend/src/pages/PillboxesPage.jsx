import { useState } from "react";
import { Link } from "react-router-dom";
import { Pill, ArrowRight } from "lucide-react";
import {
  PageTitle,
  Card,
  Badge,
  Empty,
  useLoad,
  LoadState,
} from "../components/common/UI.jsx";
import { pillboxesService } from "../services/pillboxesService.js";
import { formatDate } from "../services/schedule.js";
export default function PillboxesPage() {
  const [filter, setFilter] = useState("all");
  const { data, error } = useLoad(() => pillboxesService.getAll());
  if (!data) return <LoadState data={data} error={error} />;
  const boxes = data.filter((b) => filter === "all" || b.status === filter);
  return (
    <>
      <PageTitle
        title="Таблетницы"
        action={
          <Link className="button" to="/pillboxes/new">
            Добавить таблетницу
          </Link>
        }
        description="Устройства отделения и их состояние."
      />
      <div className="toolbar">
        <select
          aria-label="Статус таблетницы"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Все устройства</option>
          <option value="AVAILABLE">Свободные</option>
          <option value="ASSIGNED">Переданные</option>
          <option value="ACTIVE">Активные</option>
          <option value="OFFLINE">Нет связи</option>
          <option value="ERROR">Ошибка</option>
          <option value="MAINTENANCE">Обслуживание</option>
        </select>
      </div>
      <div className="device-list">
        {boxes.map((b) => (
          <Card key={b.id}>
            <div className="section-heading">
              <div className="device-emblem">
                <Pill size={27} />
              </div>
              <Badge status={b.status} />
            </div>
            <h2>{b.device_id}</h2>
            <p className="muted">
              {b.serial_number} · {b.model}
            </p>
            <p>
              Последняя связь
              <br />
              <strong>{formatDate(b.last_seen_at)}</strong>
            </p>
            <Link className="button secondary full" to={`/pillboxes/${b.id}`}>
              Открыть устройство
              <ArrowRight size={17} />
            </Link>
          </Card>
        ))}
      </div>
      {!boxes.length && <Empty title="Устройств с таким статусом нет" />}
    </>
  );
}
