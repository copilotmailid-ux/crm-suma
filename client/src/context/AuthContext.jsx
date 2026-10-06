import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [student, setStudent] = useState(null);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'admin');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole === 'student') {
        const res = await axios.get('/api/student-auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudent(res.data);
        setUserRole('student');
      } else {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmin(res.data);
        setUserRole('admin');
        localStorage.setItem('userRole', 'admin');
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Admin login
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: newToken, ...adminData } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', 'admin');
    setToken(newToken);
    setUserRole('admin');
    setAdmin(adminData);
    setStudent(null);
    return res.data;
  };

  // Student login
  const studentLogin = async (rollNumber, password) => {
    const res = await axios.post('/api/student-auth/login', { rollNumber, password });
    const { token: newToken, ...studentData } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('userRole', 'student');
    setToken(newToken);
    setUserRole('student');
    setStudent(studentData);
    setAdmin(null);
    return res.data;
  };

  // Update student profile
  const updateStudentProfileState = async (data) => {
    const res = await axios.put('/api/student-auth/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data?.student) {
      setStudent(res.data.student);
    }
    return res.data;
  };

  // Change student password
  const changeStudentPasswordAction = async (currentPassword, newPassword) => {
    const res = await axios.put(
      '/api/student-auth/change-password',
      { currentPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setToken(null);
    setUserRole(null);
    setAdmin(null);
    setStudent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        student,
        userRole,
        token,
        loading,
        login,
        studentLogin,
        updateStudentProfile: updateStudentProfileState,
        changeStudentPassword: changeStudentPasswordAction,
        logout,
        isAuthenticated: !!token,
        isAdmin: !!token && userRole === 'admin',
        isStudent: !!token && userRole === 'student',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
