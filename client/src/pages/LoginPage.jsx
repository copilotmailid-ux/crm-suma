import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineAcademicCap, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import '../styles/auth.css';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, studentLogin, isAuthenticated, isAdmin, isStudent } = useAuth();

  // If path is /student/login, default to student tab
  const isStudentRoute = location.pathname.includes('/student');
  const [activeTab, setActiveTab] = useState(isStudentRoute ? 'student' : 'student'); // Default to student for user convenience, or toggle to admin

  // Admin form state
  const [email, setEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Student form state
  const [rollNumber, setRollNumber] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.pathname === '/student/login') {
      setActiveTab('student');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) navigate('/', { replace: true });
      else if (isStudent) navigate('/student/drives', { replace: true });
    }
  }, [isAuthenticated, isAdmin, isStudent, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === 'student') {
        await studentLogin(rollNumber.trim(), studentPassword);
        navigate('/student/drives');
      } else {
        await login(email.trim(), adminPassword);
        navigate('/');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (activeTab === 'student' ? 'Student login failed. Check Roll Number & Password' : 'Admin login failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img 
            src="/logo.png" 
            alt="NSCET Logo" 
            className="auth-logo-img" 
            style={{ 
              height: '110px', 
              margin: '0 auto 16px', 
              objectFit: 'contain'
            }} 
          />
          <h1 className="auth-title" style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.2 }}>
            Nadar Saraswathi College of Engineering and Technology
          </h1>
          <p className="auth-subtitle" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Training & Placement Cell Portal
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'student' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('student');
              setError('');
            }}
            id="tab-student-login"
          >
            <HiOutlineAcademicCap style={{ fontSize: '1.15rem' }} /> Student Login
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('admin');
              setError('');
            }}
            id="tab-admin-login"
          >
            <HiOutlineShieldCheck style={{ fontSize: '1.15rem' }} /> Admin Login
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {activeTab === 'student' ? (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="student-roll">Roll Number</label>
                <input
                  id="student-roll"
                  className="form-input"
                  type="text"
                  placeholder="e.g. 21CSE001, 22IT015"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="student-password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="student-password"
                    className="form-input"
                    type={showStudentPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    aria-label={showStudentPassword ? 'Hide password' : 'Show password'}
                    title={showStudentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showStudentPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>

              <div className="auth-hint">
                💡 <strong>Default Password:</strong> <code>Student@123</code> or your <strong>Roll Number</strong>. You can change your password anytime after logging in.
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">Admin Email Address</label>
                <input
                  id="login-email"
                  className="form-input"
                  type="email"
                  placeholder="admin@placementcell.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="login-password">Admin Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="login-password"
                    className="form-input"
                    type={showAdminPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    title={showAdminPassword ? 'Hide password' : 'Show password'}
                  >
                    {showAdminPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                  </button>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
            id="login-submit"
          >
            {loading ? 'Authenticating...' : activeTab === 'student' ? 'Sign In as Student' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
