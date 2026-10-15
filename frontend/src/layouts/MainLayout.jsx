import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  UsersRound,
  ClipboardList,
  Pill,
  Bell,
  LogOut,
  CircleUserRound,
  Menu,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "../components/common/UI.jsx";
import { useMocks } from "../services/api.js";
const navigation = [
  ["/", "Главная", LayoutDashboard],
  ["/patients", "Пациенты", UsersRound],
  ["/prescriptions", "Назначения", ClipboardList],
  ["/pillboxes", "Таблетницы", Pill],
  ["/alerts", "Уведомления", Bell],
];
function Navigation({ mobile = false }) {
  const links = mobile
    ? [
        navigation[0],
        navigation[2],
        navigation[1],
        navigation[4],
        ["/more", "Ещё", Menu],
      ]
    : navigation;
  return (
    <nav aria-label={mobile ? "Мобильная навигация" : "Основная навигация"}>
      {links.map(([to, label, Icon]) => (
        <NavLink key={to} to={to} end={to === "/"}>
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
export default function MainLayout({ user, onLogout }) {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const current =
    navigation.find(
      ([to]) => to !== "/" && location.pathname.startsWith(to),
    )?.[1] || "Рабочее место";
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/" className="brand-link">
          <Brand />
        </Link>
        <div className="nav-caption">РАБОЧЕЕ МЕСТО</div>
        <Navigation />
        <div className="sidebar-bottom">
          <div className="support-note">
            <ShieldCheck size={20} />
            <span>
              Забота о пациентах
              <br />
              <strong>В нужное время</strong>
            </span>
          </div>
          <NavLink to="/profile">
            <CircleUserRound size={20} />
            Профиль
          </NavLink>
          <button onClick={onLogout}>
            <LogOut size={20} />
            Выйти
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="header">
          <div className="breadcrumbs">
            Умная таблетница <span>/</span> <strong>{current}</strong>
          </div>
          <div className="header-actions">
            <span className="mode-tag">{useMocks ? "Деморежим" : "API"}</span>
            <Link to="/alerts" className="icon-button" aria-label="Уведомления">
              <Bell size={21} />
            </Link>
            <Link to="/profile" className="header-user">
              <span className="avatar small">АС</span>
              <span>
                <strong>Анна Иванова</strong>
                <small>Медсестра</small>
              </span>
            </Link>
          </div>
        </header>
        <main id="main-content">
          <Outlet context={{ user }} />
        </main>
        <footer className="workspace-footer">
          <span>Умная таблетница</span>
          <span>
            {useMocks
              ? "Демонстрационные данные · изменения сохраняются до обновления страницы"
              : "Подключение к FastAPI"}
          </span>
        </footer>
      </div>
      <div className="mobile-nav">
        <Navigation mobile />
      </div>
    </div>
  );
}
