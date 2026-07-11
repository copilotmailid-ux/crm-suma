import { useState, useEffect } from 'react';
import { HiOutlineUserGroup, HiOutlineCheckCircle, HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineXCircle, HiOutlineBriefcase } from 'react-icons/hi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { getStats, getDeptWise, getCompanyWise, getBatchWise, getRecent } from '../api/dashboardApi';
import Loader from '../components/common/Loader';
import '../styles/dashboard.css';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899'];

const StatCard = ({ icon, label, value, colorClass }) => (
  <div className="stat-card">
    <div className={`stat-icon ${colorClass}`}>{icon}</div>
    <div className="stat-info">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [batchData, setBatchData] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, deptRes, companyRes, batchRes, recentRes] = await Promise.all([
        getStats(),
        getDeptWise(),
        getCompanyWise(),
        getBatchWise(),
        getRecent(),
      ]);
      setStats(statsRes.data);
      setDeptData(deptRes.data);
      setCompanyData(companyRes.data);
      setBatchData(batchRes.data);
      setRecent(recentRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.8rem',
        }}>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* College Placement Banner */}
      <div className="dashboard-banner">
        <div className="banner-logo-wrapper">
          <img src="/logo.png" alt="Sri Krishna College of Engineering and Technology Logo" className="banner-logo" />
        </div>
        <div className="banner-info">
          <h2 className="banner-title">Sri Krishna College of Engineering and Technology</h2>
          <p className="banner-subtitle">Coimbatore, Tamil Nadu, India</p>
          <div className="banner-badge">
            <span>TRAINING & PLACEMENT CELL</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-stats">

        <StatCard
          icon={<HiOutlineUserGroup />}
          label="Total Students"
          value={stats?.totalStudents || 0}
          colorClass="purple"
        />
        <StatCard
          icon={<HiOutlineCheckCircle />}
          label="Placed Students"
          value={stats?.placedStudents || 0}
          colorClass="green"
        />
        <StatCard
          icon={<HiOutlineXCircle />}
          label="Unplaced Students"
          value={stats?.unplacedStudents || 0}
          colorClass="amber"
        />
        <StatCard
          icon={<HiOutlineUsers />}
          label="Alumni"
          value={stats?.totalAlumni || 0}
          colorClass="blue"
        />
        <StatCard
          icon={<HiOutlineOfficeBuilding />}
          label="Companies"
          value={stats?.totalCompanies || 0}
          colorClass="purple"
        />
        <StatCard
          icon={<HiOutlineBriefcase />}
          label="Total Placements"
          value={stats?.totalPlacements || 0}
          colorClass="green"
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Dept-wise Pie Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Department-wise Placements</h3>
          </div>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deptData}
                  dataKey="placed"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={3}
                  label={({ department, placed }) => `${department}: ${placed}`}
                  labelLine={true}
                >
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p className="empty-text">No department data yet</p></div>
          )}
        </div>

        {/* Company-wise Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Top Companies by Placements</h3>
          </div>
          {companyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companyData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <YAxis dataKey="companyName" type="category" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Students" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p className="empty-text">No company data yet</p></div>
          )}
        </div>

        {/* Batch-wise Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3 className="chart-card-title">Batch-wise Placements</h3>
          </div>
          {batchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={batchData} margin={{ top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="batch" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                <Bar dataKey="placed" name="Placed" fill="#10b981" radius={[6, 6, 0, 0]} barSize={30} />
                <Bar dataKey="unplaced" name="Unplaced" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p className="empty-text">No batch data yet</p></div>
          )}
        </div>
      </div>

      {/* Recent Placements */}
      <div className="recent-section">
        <div className="recent-header">
          <h3 className="recent-title">Recent Placements</h3>
        </div>
        {recent.length > 0 ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Department</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Package (LPA)</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.studentId?.name || '-'}</td>
                    <td>{p.studentId?.rollNumber || '-'}</td>
                    <td><span className="badge badge-info">{p.studentId?.department || '-'}</span></td>
                    <td style={{ color: 'var(--text-primary)' }}>{p.companyId?.name || '-'}</td>
                    <td>{p.role}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{p.package}</td>
                    <td>{new Date(p.placementDate).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No placements recorded yet. Add students & companies to get started!</p>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardPage;
