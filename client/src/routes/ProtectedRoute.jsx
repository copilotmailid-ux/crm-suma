import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

const ProtectedRoute = ({ children, requiredRole = 'admin' }) => {
  const { isAuthenticated, loading, userRole } = useAuth();

  if (loading) return <Loader />;

  if (!isAuthenticated) {
    return <Navigate to={requiredRole === 'student' ? '/student/login' : '/login'} replace />;
  }

  // Only redirect if explicitly a student trying to access admin pages
  if (requiredRole === 'admin' && userRole === 'student') {
    return <Navigate to="/student/drives" replace />;
  }

  // Only redirect if explicitly an admin trying to access student pages
  if (requiredRole === 'student' && userRole === 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
