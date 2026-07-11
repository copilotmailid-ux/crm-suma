import { useState, useEffect } from 'react';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { getBatchAnalysis } from '../api/dashboardApi';
import { getBatches } from '../api/studentApi';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// Custom icons import fix
import { 
  HiOutlineUserGroup as UsersIcon, 
  HiOutlineCheckCircle as PlacedIcon, 
  HiOutlineXCircle as UnplacedIcon,
  HiOutlineTrendingUp as PercentIcon,
  HiOutlineCurrencyRupee as RupeeIcon,
  HiOutlineOfficeBuilding as CompanyIcon,
  HiOutlineDownload as DownloadIcon,
  HiOutlinePrinter as PrintIcon
} from 'react-icons/hi';

const COLORS = ['#0b1d37', '#c59e51', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

const StatCard = ({ icon, label, value, colorClass }) => (
  <div className="stat-card">
    <div className={`stat-icon ${colorClass}`}>{icon}</div>
    <div className="stat-info">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

const AnalysisSkeleton = () => (
  <div className="skeleton-container fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    {/* Summary Row Skeleton */}
    <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="stat-card skeleton-pulse" style={{ height: '110px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            <div className="skeleton-block" style={{ width: '48px', height: '48px', borderRadius: '8px' }}></div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton-block" style={{ width: '60%', height: '12px' }}></div>
              <div className="skeleton-block" style={{ width: '40%', height: '24px' }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Salary Package Stats Skeleton */}
    <div className="recent-section skeleton-pulse" style={{ padding: '24px' }}>
      <div className="skeleton-block" style={{ width: '200px', height: '20px', marginBottom: '20px' }}></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div className="skeleton-block" style={{ width: '100px', height: '12px' }}></div>
            <div className="skeleton-block" style={{ width: '60px', height: '24px' }}></div>
          </div>
        ))}
      </div>
    </div>

    {/* Charts Row Skeleton */}
    <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {[1, 2].map((i) => (
        <div key={i} className="chart-card skeleton-pulse" style={{ height: '350px', padding: '24px' }}>
          <div className="skeleton-block" style={{ width: '180px', height: '20px', marginBottom: '24px' }}></div>
          <div className="skeleton-block" style={{ width: '100%', height: '250px' }}></div>
        </div>
      ))}
    </div>

    {/* Top Recruiters Skeleton */}
    <div className="recent-section skeleton-pulse" style={{ padding: '24px' }}>
      <div className="skeleton-block" style={{ width: '150px', height: '20px', marginBottom: '20px' }}></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="skeleton-block" style={{ width: '120px', height: '14px' }}></div>
            <div className="skeleton-block" style={{ width: '50px', height: '14px' }}></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AnalysisPage = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch unique batches
    getBatches()
      .then((res) => {
        const batchList = res.data.sort().reverse(); // Show latest batch first
        setBatches(batchList);
        if (batchList.length > 0) {
          setSelectedBatch(batchList[0]);
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        toast.error('Failed to load batches list');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    setLoading(true);
    getBatchAnalysis(selectedBatch)
      .then((res) => {
        setData(res.data);
      })
      .catch(() => {
        toast.error('Failed to fetch analysis stats');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedBatch]);

  const handleExportReport = () => {
    if (!data) return;
    try {
      const summaryData = [
        { Metric: 'Total Students', Value: data.summary.totalStudents },
        { Metric: 'Placed Students', Value: data.summary.placedStudents },
        { Metric: 'Unplaced Students', Value: data.summary.unplacedStudents },
        { Metric: 'Placement Percentage', Value: `${data.summary.placementPercentage}%` },
        { Metric: 'Highest Package (LPA)', Value: data.summary.highestPackage },
        { Metric: 'Average Package (LPA)', Value: data.summary.averagePackage },
        { Metric: 'Lowest Package (LPA)', Value: data.summary.lowestPackage },
      ];

      const deptData = data.deptStats.map(d => ({
        Department: d.department,
        'Total Students': d.total,
        'Placed Students': d.placed,
        'Unplaced Students': d.unplaced,
        'Placement %': `${d.percentage}%`
      }));

      const wb = XLSX.utils.book_new();
      
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 30 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      const wsDept = XLSX.utils.json_to_sheet(deptData);
      wsDept['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsDept, 'Department Wise');

      // Add Top Recruiters & Selected Students Detail Sheet
      const recruiterData = [];
      data.companyStats.forEach((c) => {
        if (c.students && c.students.length > 0) {
          c.students.forEach((student) => {
            recruiterData.push({
              Company: c.companyName,
              'Student Name': student.name,
              'Roll Number': student.rollNumber,
              Department: student.department,
            });
          });
        } else {
          recruiterData.push({
            Company: c.companyName,
            'Student Name': 'No details',
            'Roll Number': '-',
            Department: '-',
          });
        }
      });

      const wsRecruiters = XLSX.utils.json_to_sheet(recruiterData);
      wsRecruiters['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsRecruiters, 'Recruiter Details');

      XLSX.writeFile(wb, `Batch_${selectedBatch}_Placement_Report.xlsx`);
      toast.success('Report exported to Excel successfully');
    } catch (err) {
      toast.error('Failed to export batch report');
    }
  };

  if (loading && !data) return <Loader />;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.8rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }}>
          <p style={{ color: '#0f172a', fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color || '#0b1d37', margin: 0 }}>
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
      {/* College Print Header (only visible on print) */}
      <div className="print-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderBottom: '2px solid #0b1d37', paddingBottom: '16px', marginBottom: '24px', width: '100%' }}>
          <img src="/logo.png" alt="Sri Krishna CE Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0b1d37', margin: 0 }}>SRI KRISHNA COLLEGE OF ENGINEERING AND TECHNOLOGY</h1>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>Coimbatore, Tamil Nadu, India | Training & Placement Cell</p>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c59e51', margin: '8px 0 0' }}>Batch {selectedBatch} - Placement Analysis Report</h2>
          </div>
        </div>
      </div>

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2 className="page-header-title">Batch Placement Analysis</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Detailed statistics and metrics for students placement cell
          </p>
        </div>
        <div className="page-header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Batch:</label>
            <select 
              className="filter-select" 
              value={selectedBatch} 
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{ padding: '8px 32px 8px 12px', minWidth: '130px' }}
            >
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()} disabled={!data} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PrintIcon /> Export PDF Report (With Charts)
            </button>
          </div>
        </div>
      </div>

      {loading ? <AnalysisSkeleton /> : data && (
        <>
          {/* Summary Row */}
          <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <StatCard
              icon={<UsersIcon />}
              label="Total Batch Students"
              value={data.summary.totalStudents}
              colorClass="blue"
            />
            <StatCard
              icon={<PlacedIcon />}
              label="Placed Students"
              value={data.summary.placedStudents}
              colorClass="green"
            />
            <StatCard
              icon={<PercentIcon />}
              label="Placement Rate"
              value={`${data.summary.placementPercentage}%`}
              colorClass="purple"
            />
            <StatCard
              icon={<RupeeIcon />}
              label="Average Salary (LPA)"
              value={`${data.summary.averagePackage} LPA`}
              colorClass="green"
            />
          </div>

          {/* Salary Stats Card Grid */}
          <div className="salary-stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)'
          }}>
            <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
              <div className="stat-icon green" style={{ background: 'rgba(5, 150, 105, 0.1)', color: '#059669' }}>
                <RupeeIcon />
              </div>
              <div className="stat-info">
                <div className="stat-label">Highest Package</div>
                <div className="stat-value" style={{ color: '#059669' }}>{data.summary.highestPackage} LPA</div>
              </div>
            </div>
            <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
              <div className="stat-icon blue" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
                <RupeeIcon />
              </div>
              <div className="stat-info">
                <div className="stat-label">Average Package</div>
                <div className="stat-value" style={{ color: '#2563eb' }}>{data.summary.averagePackage} LPA</div>
              </div>
            </div>
            <div className="stat-card" style={{ background: 'var(--bg-card)' }}>
              <div className="stat-icon red" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                <RupeeIcon />
              </div>
              <div className="stat-info">
                <div className="stat-label">Lowest Package</div>
                <div className="stat-value" style={{ color: '#dc2626' }}>{data.summary.lowestPackage} LPA</div>
              </div>
            </div>
          </div>

          {/* Detailed Charts */}
          <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* Department Wise Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Department-wise Placement Ratio (%)</h3>
              </div>
              {data.deptStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.deptStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="department" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                    <YAxis unit="%" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="percentage" name="Placement Rate" fill="#0b1d37" radius={[6, 6, 0, 0]} barSize={35}>
                      {data.deptStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state"><p className="empty-text">No department statistics</p></div>
              )}
            </div>

            {/* Salary Package Ranges Distribution */}
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-card-title">Salary Packages Distribution (Offers Count)</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.packageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="range" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Offers Count" fill="#c59e51" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department breakdown and recruiters */}
          <div className="charts-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
            {/* Department Wise BreakDown Table */}
            <div className="chart-card" style={{ padding: '20px' }}>
              <div className="chart-card-header" style={{ marginBottom: '16px' }}>
                <h3 className="chart-card-title">Department Wise Placements Details</h3>
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Total Students</th>
                      <th>Placed Students</th>
                      <th>Unplaced Students</th>
                      <th>Placement %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.deptStats.map((d, index) => (
                      <tr key={index}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.department}</td>
                        <td>{d.total}</td>
                        <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{d.placed}</td>
                        <td style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{d.unplaced}</td>
                        <td>
                          <span className="badge badge-success" style={{ fontWeight: 700 }}>
                            {d.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top recruiting companies list */}
            <div className="chart-card">
              <div className="chart-card-header" style={{ marginBottom: '16px' }}>
                <h3 className="chart-card-title">Top Recruiter Companies</h3>
              </div>
              {data.companyStats.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {data.companyStats.map((c, index) => (
                    <div key={index} style={{
                      padding: '12px 16px',
                      background: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: `4px solid ${COLORS[index % COLORS.length]}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {index + 1}. {c.companyName}
                        </span>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          {c.count} Selected
                        </span>
                      </div>
                      
                      {/* Placed Students List */}
                      {c.students && c.students.length > 0 && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          paddingLeft: '14px',
                          borderLeft: '1px dashed var(--border-color)',
                          marginTop: '4px'
                        }}>
                          {c.students.map((student, sIdx) => (
                            <div key={sIdx} style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)'
                            }}>
                              <span style={{ fontWeight: 500 }}>
                                • {student.name} <span style={{ color: 'var(--text-muted)' }}>({student.rollNumber})</span>
                              </span>
                              <span className="badge badge-neutral" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                {student.department}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="empty-text">No company placement statistics yet</p>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </>
  );
};

export default AnalysisPage;
