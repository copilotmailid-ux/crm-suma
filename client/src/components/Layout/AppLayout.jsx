import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/drives': 'Company Placement Drives',
  '/companies': 'Companies',
  '/placements': 'Placements',
  '/alumni': 'Alumni',
  '/analysis': 'Analysis',
  '/training-dashboard': 'Training Dashboard',
  '/placement-events': 'Upcoming Events & Attendance',
  '/events': 'Upcoming Events & Attendance',
  '/placement-timetable': 'Placement Timetable',
  '/faculty-directory': 'Faculty Directory',
  '/workload-analytics': 'Workload & Analytics',
};

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="app-layout">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar
          title={title}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={handleToggle}
        />
        <div className="page-content" key={location.pathname}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
