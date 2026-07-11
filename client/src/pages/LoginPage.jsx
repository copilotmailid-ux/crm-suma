import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import '../styles/auth.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
            alt="Sri Krishna CE Logo" 
            className="auth-logo-img" 
            style={{ 
              height: '110px', 
              margin: '0 auto 16px', 
              objectFit: 'contain'
            }} 
          />
          <h1 className="auth-title" style={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.2 }}>
            Sri Krishna College of Engineering and Technology
          </h1>
          <p className="auth-subtitle" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
            Training & Placement Cell Admin Login
          </p>
        </div>


        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              className="form-input"
              type="email"
              placeholder="admin@placementcell.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
            id="login-submit"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
