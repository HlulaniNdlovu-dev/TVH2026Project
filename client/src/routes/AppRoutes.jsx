import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Spinner from '../components/Spinner.jsx';
import ProtectedRoute from '../features/auth/ProtectedRoute.jsx';
import CitizenLayout from '../components/layouts/CitizenLayout.jsx';
import TechnicianLayout from '../components/layouts/TechnicianLayout.jsx';
import AdminLayout from '../components/layouts/AdminLayout.jsx';

import LandingPage from '../pages/onboarding/LandingPage.jsx';
import LoginPage from '../pages/onboarding/LoginPage.jsx';
import RegisterPage from '../pages/onboarding/RegisterPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const CitizenDashboardPage = lazy(() => import('../pages/citizen/CitizenDashboardPage.jsx'));
const ReportOutagePage = lazy(() => import('../pages/citizen/ReportOutagePage.jsx'));
const IncidentTrackerPage = lazy(() => import('../pages/citizen/IncidentTrackerPage.jsx'));
const NotificationsPage = lazy(() => import('../pages/citizen/NotificationsPage.jsx'));
const ProfilePage = lazy(() => import('../pages/citizen/ProfilePage.jsx'));

const TechnicianDashboardPage = lazy(() => import('../pages/technician/TechnicianDashboardPage.jsx'));
const TaskDetailPage = lazy(() => import('../pages/technician/TaskDetailPage.jsx'));
const CloseTaskPage = lazy(() => import('../pages/technician/CloseTaskPage.jsx'));
const TaskHistoryPage = lazy(() => import('../pages/technician/TaskHistoryPage.jsx'));

const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage.jsx'));
const LiveGridPage = lazy(() => import('../pages/admin/LiveGridPage.jsx'));
const IncidentsPage = lazy(() => import('../pages/admin/IncidentsPage.jsx'));
const IncidentDetailPage = lazy(() => import('../pages/admin/IncidentDetailPage.jsx'));
const DispatchBoardPage = lazy(() => import('../pages/admin/DispatchBoardPage.jsx'));
const TechnicianOversightPage = lazy(() => import('../pages/admin/TechnicianOversightPage.jsx'));
const LoadsheddingPage = lazy(() => import('../pages/admin/LoadsheddingPage.jsx'));
const SensorsPage = lazy(() => import('../pages/admin/SensorsPage.jsx'));
const AnalyticsPage = lazy(() => import('../pages/admin/AnalyticsPage.jsx'));
const AuditLogPage = lazy(() => import('../pages/admin/AuditLogPage.jsx'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
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
    </Suspense>
  );
}
