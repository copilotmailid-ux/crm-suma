import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/companies': 'Companies',
  '/placements': 'Placements',
  '/alumni': 'Alumni',
};

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <div className="app-layout">
      <Sidebar collapsed={collapsed} />
      <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar
          title={title}
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
        <div className="page-content fade-in" key={location.pathname}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
