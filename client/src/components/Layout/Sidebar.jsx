import { NavLink, useLocation } from 'react-router-dom';
import { HiOutlineAcademicCap, HiOutlineChartBar, HiOutlineUserGroup, HiOutlineOfficeBuilding, HiOutlineBriefcase, HiOutlineUsers, HiOutlineLogout, HiOutlineTrendingUp } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/', icon: <HiOutlineChartBar /> },
  { label: 'Students', path: '/students', icon: <HiOutlineUserGroup /> },
  { label: 'Companies', path: '/companies', icon: <HiOutlineOfficeBuilding /> },
  { label: 'Placements', path: '/placements', icon: <HiOutlineBriefcase /> },
  { label: 'Alumni', path: '/alumni', icon: <HiOutlineUsers /> },
  { label: 'Analysis', path: '/analysis', icon: <HiOutlineTrendingUp /> },
];


const Sidebar = ({ collapsed }) => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <img src="/logo.png" alt="SKCET Logo" className="brand-logo-img" />
        <span className="brand-text" style={{ fontSize: '0.95rem' }}>SKCET</span>
      </div>


      <nav className="sidebar-nav">
        <span className="nav-label">Main Menu</span>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
            end={item.path === '/'}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item" onClick={logout} style={{ width: '100%' }}>
          <span className="nav-icon"><HiOutlineLogout /></span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
