import {Link} from 'react-router-dom';
import {CheckCircle2, Plus, Clock3} from 'lucide-react';
import {Badge} from '../common/UI.jsx';
import {nextOccurrence} from '../../services/schedule.js';
export default function CellGrid({box, readOnly = false}) {
  return <div className="cell-grid">{box.cells.map(cell => {
    const next = cell.item && nextOccurrence(cell.item, cell.item.schedule);
    const content = <><div className="cell-top"><span className="cell-number">{cell.cell_number}</span>{cell.status === 'EMPTY' ? <Plus size={18}/> : cell.status === 'ACTIVE' ? <CheckCircle2 size={18}/> : <Clock3 size={18}/>}</div><strong>{cell.item?.drug_name || 'Пустая ячейка'}</strong><span className="cell-dose">{cell.item ? `${cell.item.dosage} · ${cell.item.quantity} табл.` : 'Можно настроить'}</span>{cell.item && <span className="cell-time">{next ? next.toLocaleString('ru-RU', {timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'}) : 'Нет будущих событий'}</span>}<Badge status={cell.status}/></>;
    return readOnly || !box.assignment ? <div key={cell.cell_number} className={`cell ${cell.status}`}>{content}</div> : <Link aria-label={`Настроить ячейку ${cell.cell_number}`} key={cell.cell_number} className={`cell ${cell.status}`} to={`/pillboxes/${box.id}/cells/${cell.cell_number}`}>{content}</Link>;
  })}</div>;
}
