import { useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useOutletContext,
} from "react-router-dom";
import MainLayout from "../layouts/MainLayout.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";
import PatientsPage from "../pages/PatientsPage.jsx";
import PatientPage from "../pages/PatientPage.jsx";
import PrescriptionPage from "../pages/PrescriptionPage.jsx";
import PrescriptionsPage from "../pages/PrescriptionsPage.jsx";
import PillboxSelectionPage from "../pages/PillboxSelectionPage.jsx";
import PillboxesPage from "../pages/PillboxesPage.jsx";
import PillboxPage from "../pages/PillboxPage.jsx";
import CellConfigurationPage from "../pages/CellConfigurationPage.jsx";
import FillingConfirmationPage from "../pages/FillingConfirmationPage.jsx";
import HistoryPage from "../pages/HistoryPage.jsx";
import AlertsPage from "../pages/AlertsPage.jsx";
import { authService } from "../services/authService.js";
import { PageTitle, Card, Button } from "../components/common/UI.jsx";
function Profile({ onLogout }) {
  const { user } = useOutletContext();
  return (
    <>
      <PageTitle title="Профиль" />
      <Card>
        <h2>{user.full_name}</h2>
        <p>Медсестра · {user.username}</p>
        <Button className="secondary" onClick={onLogout}>
          Выйти из системы
        </Button>
      </Card>
    </>
  );
}
function More({ onLogout }) {
  return (
    <>
      <PageTitle title="Ещё" />
      <Card className="more-links">
        <Link to="/pillboxes">Таблетницы →</Link>
        <Link to="/profile">Профиль →</Link>
        <Button className="secondary" onClick={onLogout}>
          Выйти
        </Button>
      </Card>
    </>
  );
}
export default function App() {
  const [user, setUser] = useState(authService.current());
  async function logout() {
    await authService.logout();
    setUser(null);
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        К основному содержимому
      </a>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />
          }
        />
        <Route
          element={
            user ? (
              <MainLayout user={user} onLogout={logout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientPage />} />
          <Route
            path="patients/:id/prescriptions/new"
            element={<PrescriptionPage />}
          />
          <Route
            path="patients/:id/pillboxes/select"
            element={<PillboxSelectionPage />}
          />
          <Route path="patients/:id/history" element={<HistoryPage />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="pillboxes" element={<PillboxesPage />} />
          <Route path="pillboxes/:id" element={<PillboxPage />} />
          <Route
            path="pillboxes/:id/cells/:cell"
            element={<CellConfigurationPage />}
          />
          <Route
            path="pillboxes/:id/filling"
            element={<FillingConfirmationPage />}
          />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="profile" element={<Profile onLogout={logout} />} />
          <Route path="more" element={<More onLogout={logout} />} />
          <Route
            path="*"
            element={
              <>
                <PageTitle title="Страница не найдена" />
                <Link className="button" to="/">
                  На главную
                </Link>
              </>
            }
          />
        </Route>
      </Routes>
    </>
  );
}
