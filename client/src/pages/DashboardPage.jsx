import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineXCircle,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineFilter,
  HiOutlineAcademicCap,
  HiOutlineClipboardCheck,
  HiOutlineSparkles,
} from 'react-icons/hi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { getStats, getDeptWise, getCompanyWise, getBatchWise, getRecent } from '../api/dashboardApi';
import { getBatches } from '../api/studentApi';
import Loader from '../components/common/Loader';
import FacultyTimetablePage from './FacultyTimetablePage';
import '../styles/dashboard.css';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899'];

const DEFAULT_BATCHES = ['2023-2027', '2022-2026', '2021-2025', '2020-2024'];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [dashboardMode, setDashboardMode] = useState(urlTab === 'training' ? 'training' : 'drives');

  const [stats, setStats] = useState(null);
  const [deptData, setDeptData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [batchData, setBatchData] = useState([]);
  const [recent, setRecent] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [batches, setBatches] = useState(DEFAULT_BATCHES);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);

  // Sync mode with URL search params
  useEffect(() => {
    if (urlTab === 'training' && dashboardMode !== 'training') {
      setDashboardMode('training');
    } else if ((!urlTab || urlTab === 'drives') && dashboardMode !== 'drives') {
      setDashboardMode('drives');
    }
  }, [urlTab]);

  const handleModeChange = (mode) => {
    setDashboardMode(mode);
    setSearchParams(mode === 'training' ? { tab: 'training' } : {});
  };

  useEffect(() => {
    // Fetch available batches
    getBatches()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          const combined = Array.from(new Set([...res.data, ...DEFAULT_BATCHES])).sort().reverse();
          setBatches(combined);
        }
      })
      .catch((err) => console.error('Failed to fetch batch list:', err));
  }, []);

  useEffect(() => {
    fetchDashboardData(selectedBatch);
  }, [selectedBatch]);

  const fetchDashboardData = async (batch) => {
    try {
      if (stats) setFilterLoading(true);
      const params = batch ? { batch } : {};
      const [statsRes, deptRes, companyRes, batchRes, recentRes] = await Promise.all([
        getStats(params),
        getDeptWise(params),
        getCompanyWise(params),
        getBatchWise(),
        getRecent(params),
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
      setFilterLoading(false);
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
      {/* Dashboard Mode Selector: Placement Drive vs Placement Event & Training */}
      <div
        className="dashboard-module-toggle"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card, #ffffff)',
          padding: '8px 12px',
          borderRadius: '16px',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleModeChange('drives')}
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              background:
                dashboardMode === 'drives'
                  ? 'linear-gradient(135deg, #0b1d37 0%, #1e3a5f 100%)'
                  : 'transparent',
              color: dashboardMode === 'drives' ? '#ffffff' : 'var(--text-secondary, #64748b)',
              boxShadow:
                dashboardMode === 'drives'
                  ? '0 4px 12px rgba(11, 29, 55, 0.25)'
                  : 'none',
            }}
          >
            <HiOutlineBriefcase style={{ fontSize: '1.15rem' }} />
            Placement Drive Dashboard
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('training')}
            style={{
              padding: '10px 22px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              background:
                dashboardMode === 'training'
                  ? 'linear-gradient(135deg, #0b1d37 0%, #1e3a5f 100%)'
                  : 'transparent',
              color: dashboardMode === 'training' ? '#ffffff' : 'var(--text-secondary, #64748b)',
              boxShadow:
                dashboardMode === 'training'
                  ? '0 4px 12px rgba(11, 29, 55, 0.25)'
                  : 'none',
            }}
          >
            <HiOutlineCalendar style={{ fontSize: '1.15rem' }} />
            Placement Event & Training Dashboard
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '6px' }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '20px',
              background: dashboardMode === 'drives' ? '#eff6ff' : '#f0fdf4',
              color: dashboardMode === 'drives' ? '#1d4ed8' : '#15803d',
              border: `1px solid ${dashboardMode === 'drives' ? '#bfdbfe' : '#bbf7d0'}`,
            }}
          >
            {dashboardMode === 'drives' ? '📊 Placement Drive Modules' : '🎓 Placement Event & Training Modules'}
          </span>
        </div>
      </div>

      {dashboardMode === 'training' ? (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <FacultyTimetablePage />
        </div>
      ) : (
        <>
          {/* College Placement Banner with Top Year / Batch Filter */}
      <div className="dashboard-banner">
        <div className="dashboard-banner-left">
          <div className="banner-logo-wrapper">
            <img src="/logo.png" alt="Nadar Saraswathi College of Engineering and Technology Logo" className="banner-logo" />
          </div>
          <div className="banner-info">
            <h2 className="banner-title">Nadar Saraswathi College of Engineering and Technology</h2>
            <p className="banner-subtitle">Theni, Tamil Nadu, India</p>
            <div className="banner-badge">
              <span>TRAINING & PLACEMENT CELL</span>
            </div>
          </div>
        </div>

        {/* Year / Batch Filter Widget */}
        <div className="dashboard-filter-card">
          <div className="dashboard-filter-label-row">
            <span className="dashboard-filter-label">
              <HiOutlineAcademicCap style={{ fontSize: '1rem', color: '#c59e51' }} />
              Academic Year / Batch
            </span>
            {selectedBatch && (
              <button
                type="button"
                onClick={() => setSelectedBatch('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
              >
                Reset
              </button>
            )}
          </div>

          <div className="dashboard-filter-select-wrap">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="dashboard-batch-select"
              id="dashboard-batch-filter-select"
            >
              <option value="">🎓 All Batches (Cumulative)</option>
              {batches.map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Pill Filter Buttons */}
          <div className="dashboard-batch-pills">
            <button
              type="button"
              className={`batch-pill-btn ${selectedBatch === '' ? 'active' : ''}`}
              onClick={() => setSelectedBatch('')}
            >
              All
            </button>
            {batches.slice(0, 4).map((b) => (
              <button
                key={b}
                type="button"
                className={`batch-pill-btn ${selectedBatch === b ? 'active' : ''}`}
                onClick={() => setSelectedBatch(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dashboard-stats" style={{ opacity: filterLoading ? 0.6 : 1, transition: 'opacity 0.2s ease' }}>

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
      )}
    </>
  );
};

export default DashboardPage;
