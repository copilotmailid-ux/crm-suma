import { NavLink, useLocation } from 'react-router-dom';
import {
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineUserGroup,
  HiOutlineOfficeBuilding,
  HiOutlineBriefcase,
  HiOutlineUsers,
  HiOutlineLogout,
  HiOutlineTrendingUp,
  HiOutlineClipboardCheck,
  HiOutlineCalendar,
} from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

const driveNavItems = [
  { label: 'Dashboard', path: '/', icon: <HiOutlineChartBar /> },
  { label: 'Students', path: '/students', icon: <HiOutlineUserGroup /> },
  { label: 'Placement Drives', path: '/drives', icon: <HiOutlineClipboardCheck /> },
  { label: 'Companies', path: '/companies', icon: <HiOutlineOfficeBuilding /> },
  { label: 'Placements', path: '/placements', icon: <HiOutlineBriefcase /> },
  { label: 'Alumni', path: '/alumni', icon: <HiOutlineUsers /> },
  { label: 'Analysis', path: '/analysis', icon: <HiOutlineTrendingUp /> },
];

const trainingNavItems = [
  { label: 'Dashboard', path: '/training-dashboard', icon: <HiOutlineChartBar /> },
  { label: 'Placement Time Table', path: '/placement-timetable', icon: <HiOutlineCalendar /> },
  { label: 'Faculty Directory', path: '/faculty-directory', icon: <HiOutlineUserGroup /> },
  { label: 'Workload & Analytics', path: '/workload-analytics', icon: <HiOutlineTrendingUp /> },
];

const Sidebar = ({ collapsed }) => {
  const { logout } = useAuth();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <img src="/logo.png" alt="NSCET Logo" className="brand-logo-img" />
        <span className="brand-text" style={{ fontSize: '0.95rem' }}>NSCET</span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Placement Drive Modules</span>
        {driveNavItems.map((item) => (
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

        <div style={{ margin: '10px 12px 4px', borderTop: '1px solid var(--border-color, rgba(226, 232, 240, 0.6))', opacity: 0.6 }} />

        <span className="nav-label">Placement Event & Training Modules</span>
        {trainingNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
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
