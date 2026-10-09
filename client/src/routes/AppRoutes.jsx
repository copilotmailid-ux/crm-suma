import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/Layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import LandingPage from '../pages/LandingPage';
import DashboardPage from '../pages/DashboardPage';
import StudentsPage from '../pages/StudentsPage';
import CompaniesPage from '../pages/CompaniesPage';
import PlacementsPage from '../pages/PlacementsPage';
import AlumniPage from '../pages/AlumniPage';
import AnalysisPage from '../pages/AnalysisPage';
import DrivesPage from '../pages/DrivesPage';
import StudentPortalPage from '../pages/StudentPortalPage';

const AppRoutes = () => {
  const { isAuthenticated, userRole, loading } = useAuth();

  return (
    <Routes>
      {/* Root Route: Landing Page for public visitors, Dashboard for Admin, Student Portal for Students */}
      <Route
        path="/"
        element={
          !loading && isAuthenticated ? (
            userRole === 'student' ? (
              <Navigate to="/student/drives" replace />
            ) : (
              <ProtectedRoute requiredRole="admin">
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            )
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Explicit Landing Page Route */}
      <Route path="/landing" element={<LandingPage />} />

      {/* Public / Login Routes */}
      <Route
        path="/login"
        element={
          !loading && isAuthenticated ? (
            userRole === 'student' ? <Navigate to="/student/drives" replace /> : <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/student/login"
        element={
          !loading && isAuthenticated ? (
            userRole === 'student' ? <Navigate to="/student/drives" replace /> : <Navigate to="/" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Student Portal Routes */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentPortalPage />
          </ProtectedRoute>
        }
      />

      {/* Admin CRM Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AppLayout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
                <Route path="/drives" element={<DrivesPage />} />
                <Route path="/companies" element={<CompaniesPage />} />
                <Route path="/placements" element={<PlacementsPage />} />
                <Route path="/alumni" element={<AlumniPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
