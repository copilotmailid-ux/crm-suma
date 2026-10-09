import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineUserGroup, HiOutlineShieldCheck, HiOutlineAcademicCap, HiOutlineEye, HiOutlineEyeOff, HiOutlineArrowLeft } from 'react-icons/hi';
import '../styles/auth.css';

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, studentLogin, isAuthenticated, isAdmin, isStudent } = useAuth();

  // If path is /student/login or /student, default to student tab; if /login, default to admin
  const isStudentRoute = location.pathname.includes('/student');
  const [activeTab, setActiveTab] = useState(isStudentRoute ? 'student' : 'admin');

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
    if (location.pathname === '/student/login' || location.pathname === '/student') {
      setActiveTab('student');
    } else if (location.pathname === '/login') {
      setActiveTab('admin');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) navigate('/dashboard', { replace: true });
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
        navigate('/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (activeTab === 'student' ? 'Student login failed. Check Roll Number & Password' : 'Admin login failed. Check Email & Password')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Back to Home Button */}
      <Link
        to="/"
        style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '12px',
          background: 'rgba(11, 29, 55, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          fontSize: '0.85rem',
          fontWeight: 700,
          textDecoration: 'none',
          zIndex: 10,
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(11, 29, 55, 0.9)';
          e.currentTarget.style.transform = 'translateX(-3px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(11, 29, 55, 0.65)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <HiOutlineArrowLeft style={{ fontSize: '1.1rem' }} />
        <span>Back to Portal Home</span>
      </Link>

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
