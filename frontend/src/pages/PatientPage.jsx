import {Link, useParams} from 'react-router-dom';
import {Plus, Pill, ArrowRight, History} from 'lucide-react';
import {PageTitle, Card, Badge, PatientSummary, Empty, MoreLink, useLoad, LoadState} from '../components/common/UI.jsx';
import PrescriptionList from '../components/prescriptions/PrescriptionList.jsx';
import {patientsService} from '../services/patientsService.js';
import {prescriptionsService} from '../services/prescriptionsService.js';
import {pillboxesService} from '../services/pillboxesService.js';
import {eventsService} from '../services/eventsService.js';
import {formatDate} from '../services/schedule.js';
export default function PatientPage(){
  const {id}=useParams(); const {data,error}=useLoad(async()=>{const [patient,items,box,events]=await Promise.all([patientsService.getPatient(id),prescriptionsService.getPatientPrescriptions(id),pillboxesService.getPatientPillbox(id),eventsService.getEvents(id)]);return {patient,items,box,events};},[id]);
  if(!data)return <LoadState data={data} error={error}/>;
  return <><PageTitle back="/patients" title="Карточка пациента" action={<Link className="button secondary" to={`/patients/${id}/history`}><History size={17}/>История событий</Link>}/><Card className="patient-banner"><PatientSummary patient={data.patient}/><Badge status={data.patient.status}/></Card><div className="detail-columns"><Card><div className="section-heading"><h2>Назначения <span className="count">{data.items.length}</span></h2>{data.patient.status==='active'&&<Link className="button small-button" to={`/patients/${id}/prescriptions/new`}><Plus size={16}/>Добавить назначение</Link>}</div><p className="muted">Данные из бумажного листа назначений врача</p><PrescriptionList items={data.items}/></Card><Card><div className="section-heading"><h2>Текущая таблетница</h2><Pill size={21}/></div>{data.box?<><div className="device-emblem"><Pill size={35}/></div><h3>{data.box.device_id}</h3><Badge status={data.box.status}/><p className="muted">Последняя связь<br/>{formatDate(data.box.last_seen_at)}</p><Link className="button full" to={`/pillboxes/${data.box.id}`}>Открыть таблетницу<ArrowRight size={17}/></Link></>:<Empty title="Таблетница не передана"><p>Выберите свободное устройство для пациента.</p>{data.patient.status==='active'&&<Link className="button" to={`/patients/${id}/pillboxes/select`}>Выбрать таблетницу</Link>}</Empty>}</Card></div><Card><div className="section-heading"><h2>Последние события</h2><MoreLink to={`/patients/${id}/history`}/></div>{data.events.length?data.events.slice(0,3).map(e=><div className="event-preview" key={e.id}><span>{formatDate(e.occurred_at)}</span><Badge status={e.type}/><span>{e.cell_number?`Ячейка №${e.cell_number}`:'Устройство'}</span></div>):<Empty title="Событий пока нет"/>}</Card></>;
}
