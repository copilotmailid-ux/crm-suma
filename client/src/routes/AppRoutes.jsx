import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/Layout/AppLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import StudentsPage from '../pages/StudentsPage';
import CompaniesPage from '../pages/CompaniesPage';
import PlacementsPage from '../pages/PlacementsPage';
import AlumniPage from '../pages/AlumniPage';
import AnalysisPage from '../pages/AnalysisPage';

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          !loading && isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/students" element={<StudentsPage />} />
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
