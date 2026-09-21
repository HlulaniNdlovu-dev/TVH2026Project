import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../features/auth/ProtectedRoute.jsx';
import CitizenLayout from '../components/layouts/CitizenLayout.jsx';
import TechnicianLayout from '../components/layouts/TechnicianLayout.jsx';
import AdminLayout from '../components/layouts/AdminLayout.jsx';

import LandingPage from '../pages/onboarding/LandingPage.jsx';
import LoginPage from '../pages/onboarding/LoginPage.jsx';
import RegisterPage from '../pages/onboarding/RegisterPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

import CitizenDashboardPage from '../pages/citizen/CitizenDashboardPage.jsx';
import ReportOutagePage from '../pages/citizen/ReportOutagePage.jsx';
import IncidentTrackerPage from '../pages/citizen/IncidentTrackerPage.jsx';
import NotificationsPage from '../pages/citizen/NotificationsPage.jsx';
import ProfilePage from '../pages/citizen/ProfilePage.jsx';

import TechnicianDashboardPage from '../pages/technician/TechnicianDashboardPage.jsx';
import TaskDetailPage from '../pages/technician/TaskDetailPage.jsx';
import CloseTaskPage from '../pages/technician/CloseTaskPage.jsx';
import TaskHistoryPage from '../pages/technician/TaskHistoryPage.jsx';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import LiveGridPage from '../pages/admin/LiveGridPage.jsx';
import IncidentsPage from '../pages/admin/IncidentsPage.jsx';
import IncidentDetailPage from '../pages/admin/IncidentDetailPage.jsx';
import DispatchBoardPage from '../pages/admin/DispatchBoardPage.jsx';
import TechnicianOversightPage from '../pages/admin/TechnicianOversightPage.jsx';
import LoadsheddingPage from '../pages/admin/LoadsheddingPage.jsx';
import SensorsPage from '../pages/admin/SensorsPage.jsx';
import AnalyticsPage from '../pages/admin/AnalyticsPage.jsx';
import AuditLogPage from '../pages/admin/AuditLogPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute role="citizen" />}>
        <Route path="/citizen" element={<CitizenLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CitizenDashboardPage />} />
          <Route path="report" element={<ReportOutagePage />} />
          <Route path="incidents" element={<IncidentTrackerPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="technician" />}>
        <Route path="/technician" element={<TechnicianLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TechnicianDashboardPage />} />
          <Route path="tasks/:jobId" element={<TaskDetailPage />} />
          <Route path="tasks/:jobId/close" element={<CloseTaskPage />} />
          <Route path="history" element={<TaskHistoryPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="grid" element={<LiveGridPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="incidents/:incidentId" element={<IncidentDetailPage />} />
          <Route path="dispatch" element={<DispatchBoardPage />} />
          <Route path="technicians" element={<TechnicianOversightPage />} />
          <Route path="loadshedding" element={<LoadsheddingPage />} />
          <Route path="sensors" element={<SensorsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="audit" element={<AuditLogPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
