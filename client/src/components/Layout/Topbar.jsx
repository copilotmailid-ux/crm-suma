import { HiOutlineMenu, HiOutlineMenuAlt2 } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ title, collapsed, onToggle }) => {
  const { admin } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="topbar">
      <div className="topbar-container">
        <div className="topbar-left">
          <button className="toggle-btn" onClick={onToggle} id="sidebar-toggle">
            {collapsed ? <HiOutlineMenu /> : <HiOutlineMenuAlt2 />}
          </button>
          <h1 className="page-title">{title}</h1>
        </div>
        <div className="topbar-right">
          <div className="admin-badge">
            <div className="admin-avatar">{getInitials(admin?.name)}</div>
            <span className="admin-name">{admin?.name || 'Admin'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
