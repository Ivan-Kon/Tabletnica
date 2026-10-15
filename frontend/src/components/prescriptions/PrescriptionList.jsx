import {Badge, Empty} from '../common/UI.jsx';
import {scheduleLabel} from '../../services/schedule.js';
export default function PrescriptionList({items}) { return items.length ? <div className="prescription-list">{items.map(item => <article className="prescription-row" key={item.id}><div><strong>{item.drug_name}</strong><p>{item.dosage} · {item.quantity} табл.</p><span className="muted">{scheduleLabel(item.schedule)}</span></div><Badge status={item.status}/></article>)}</div> : <Empty title="Назначений пока нет"><p>Перенесите данные из бумажного листа врача.</p></Empty>; }
