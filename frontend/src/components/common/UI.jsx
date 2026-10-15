import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowLeft, ArrowRight, Pill, LoaderCircle, Inbox} from 'lucide-react';
export function Brand() { return <span className="brand"><span className="brand-symbol"><Pill size={25}/></span><span>Умная<br/>таблетница</span></span>; }
export function Button({children, loading, className = '', ...props}) { return <button {...props} disabled={props.disabled || loading} className={`button ${className}`} aria-busy={loading || undefined}>{loading && <LoaderCircle size={17} className="spin"/>}{children}</button>; }
export function PageTitle({eyebrow, title, description, action, back}) { return <><div className="page-heading"><div>{back && <Link className="back" to={back}><ArrowLeft size={15}/>Назад</Link>}{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1>{title}</h1>{description && <p className="muted">{description}</p>}</div>{action}</div></>; }
export function Card({children, className = ''}) { return <section className={`card ${className}`}>{children}</section>; }
export function Empty({title = 'Пока ничего нет', children}) { return <div className="empty"><Inbox size={32}/><h3>{title}</h3>{children}</div>; }
export function ErrorMessage({error}) { return error ? <div className="notice error" role="alert">{error.message || error}</div> : null; }
const labels = {AVAILABLE: 'Свободна', ASSIGNED: 'Передана', ACTIVE: 'Активна', OFFLINE: 'Нет связи', ERROR: 'Ошибка', MAINTENANCE: 'Обслуживание', EMPTY: 'Пусто', CONFIGURED: 'Настроена', active: 'Активно', new: 'Новое', pending_setup: 'Нужна настройка', configured: 'Настроено', paused: 'Приостановлено', completed: 'Завершено', discharged: 'Выписан', archive: 'Архив', COLLECTED: 'Препарат забран', NOT_COLLECTED: 'Препарат не забран', CONFIG_PREPARED: 'Конфигурация подготовлена', reviewed: 'Просмотрено', WEIGHT_ERROR: 'Ошибка датчика веса', SERVO_ERROR: 'Ошибка сервопривода', RTC_ERROR: 'Ошибка RTC', SD_ERROR: 'Ошибка SD', COURSE_COMPLETED: 'Курс завершён'};
export const statusLabel = status => labels[status] || status;
export function Badge({status, children}) { return <span className={`badge status-${status}`}>{children || statusLabel(status)}</span>; }
export function PatientSummary({patient}) { return <div className="patient-summary"><div className="avatar">{patient.full_name.split(' ').slice(0,2).map(s => s[0]).join('')}</div><div><strong>{patient.full_name}</strong><p className="muted">Палата {patient.room_number} <span className="dot">·</span> Койка {patient.bed_number}</p></div></div>; }
export function MoreLink({to, children = 'Все'}) { return <Link className="text-link" to={to}>{children}<ArrowRight size={15}/></Link>; }
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({data: null, error: null});
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setState({data: null, error: null});
    Promise.resolve().then(loader).then(data => {if (active) setState({data, error: null});}).catch(error => {if(active) setState({data: null, error});});
    return () => { active = false; };
    // Callers provide the primitive dependencies used by their loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, revision]);
  return {...state, reload: () => setRevision(r => r+1)};
}
export function LoadState({data, error}) { return error ? <ErrorMessage error={error}/> : !data ? <div className="empty" role="status"><LoaderCircle className="spin"/>Загрузка…</div> : null; }
