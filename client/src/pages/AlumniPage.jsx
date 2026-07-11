import { useState, useEffect, useCallback } from 'react';
import { HiOutlineSearch, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineUsers, HiOutlineX } from 'react-icons/hi';
import { getAlumni, updateAlumni, deleteAlumni } from '../api/alumniApi';
import ExportButtons from '../components/common/ExportButtons';
import ConfirmModal from '../components/common/ConfirmModal';
import Loader from '../components/common/Loader';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AIDS', 'AIML', 'Other'];

const AlumniPage = () => {
  const [alumni, setAlumni] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ currentCompany: '', currentRole: '', email: '', phone: '', linkedIn: '', isActive: true });
  const [deleteId, setDeleteId] = useState(null);
  const [viewAlumni, setViewAlumni] = useState(null);
  const debouncedSearch = useDebounce(search);
 
  const fetchAlumni = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, search: debouncedSearch };
      if (filterDept) params.department = filterDept;
      if (filterYear) params.graduationYear = filterYear;
      if (filterType) params.filterType = filterType;
      const res = await getAlumni(params);
      setAlumni(res.data.alumni);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to fetch alumni');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterDept, filterYear, filterType]);

  useEffect(() => { fetchAlumni(); }, [fetchAlumni]);

  useEffect(() => {
    if (showEdit || viewAlumni || deleteId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showEdit, viewAlumni, deleteId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone && form.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    try {
      await updateAlumni(editId, form);
      toast.success('Alumni updated');
      setShowEdit(false);
      setEditId(null);
      fetchAlumni();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAlumni(deleteId);
      toast.success('Alumni record deleted');
      setDeleteId(null);
      fetchAlumni();
    } catch {
      toast.error('Failed to delete alumni');
    }
  };

  const openEdit = (a) => {
    setEditId(a._id);
    setForm({
      currentCompany: a.currentCompany || '',
      currentRole: a.currentRole || '',
      email: a.studentId?.email || '',
      phone: a.studentId?.phone || '',
      linkedIn: a.linkedIn || '',
      isActive: a.isActive !== false,
    });
    setShowEdit(true);
  };

  // Generate graduation year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

  const handleExportData = async () => {
    try {
      const params = { page: 1, limit: 1000000, search: debouncedSearch };
      if (filterDept) params.department = filterDept;
      if (filterYear) params.graduationYear = filterYear;
      if (filterType) params.filterType = filterType;
      const res = await getAlumni(params);
      return res.data.alumni;
    } catch {
      toast.error('Failed to fetch full data for export');
      return [];
    }
  };

  const exportColumns = [
    { header: 'Name', accessor: (r) => r.studentId?.name || '-' },
    { header: 'Roll No', accessor: (r) => r.studentId?.rollNumber || '-' },
    { header: 'Email', accessor: (r) => r.studentId?.email || '-' },
    { header: 'Department', accessor: (r) => r.department },
    { header: 'Graduation Year', accessor: (r) => r.graduationYear },
    { header: 'Placed Company', accessor: (r) => r.companyId?.name || '-' },
    { header: 'Current Company', accessor: (r) => r.currentCompany },
    { header: 'Current Role', accessor: (r) => r.currentRole },
    { header: 'LinkedIn', accessor: (r) => r.linkedIn },
    { header: 'Package (LPA)', accessor: (r) => r.placementId?.package || '-' },
  ];

  return (
    <>
      <div className="page-header">
        <h2 className="page-header-title">Alumni</h2>
        <div className="page-header-actions">
          <ExportButtons onExport={handleExportData} columns={exportColumns} filename="alumni" title="Alumni Report" />
        </div>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input placeholder="Search by company/role..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} id="search-alumni" />
          </div>
          <select className="filter-select" value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="filter-select" value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}>
            <option value="">All Years</option>
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="filter-select" value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="normal">Normal (Same Company)</option>
            <option value="shifted">Updated (Company Shifted)</option>
          </select>
          {(search || filterDept || filterYear || filterType) && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                setSearch('');
                setFilterDept('');
                setFilterYear('');
                setFilterType('');
                setPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)',
                padding: '8px 12px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <HiOutlineX /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? <Loader /> : (
        <div className="data-table-wrapper">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll No</th>
                  <th>Department</th>
                  <th>Grad. Year</th>
                  <th>Current Company</th>
                  <th>Current Role</th>
                  <th>Package (LPA)</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alumni.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <div className="empty-icon"><HiOutlineUsers /></div>
                        <p className="empty-title">No alumni records</p>
                        <p className="empty-text">Alumni records are auto-created when placements are recorded</p>
                      </div>
                    </td>
                  </tr>
                ) : alumni.map((a) => (
                  <tr key={a._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.studentId?.name || '-'}</td>
                    <td>{a.studentId?.rollNumber || '-'}</td>
                    <td><span className="badge badge-info">{a.department}</span></td>
                    <td>{a.graduationYear}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{a.currentCompany || '-'}</td>
                    <td>{a.currentRole || '-'}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>{a.placementId?.package || '-'}</td>
                    <td>
                      <span className={`badge ${a.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon btn-secondary" onClick={() => setViewAlumni(a)} title="View"><HiOutlineEye /></button>
                        <button className="btn-icon btn-secondary" onClick={() => openEdit(a)} title="Edit"><HiOutlinePencil /></button>
                        <button className="btn-icon btn-danger" onClick={() => setDeleteId(a._id)} title="Delete"><HiOutlineTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">Showing {alumni.length} of {total} alumni</span>
              <div className="pagination-controls">
                <button className="pagination-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
                  <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="pagination-btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>›</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="form-overlay" onClick={() => setShowEdit(false)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">Update Alumni Details</h3>
              <button className="form-close" onClick={() => setShowEdit(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Current Company</label>
                    <input className="form-input" value={form.currentCompany} onChange={(e) => setForm({...form, currentCompany: e.target.value})} placeholder="Google" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Current Role</label>
                    <input className="form-input" value={form.currentRole} onChange={(e) => setForm({...form, currentRole: e.target.value})} placeholder="Senior SDE" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="alumni@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input 
                      className="form-input" 
                      value={form.phone} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) {
                          setForm({...form, phone: val});
                        }
                      }} 
                      placeholder="9876543210" 
                      maxLength={10}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">LinkedIn Profile</label>
                    <input className="form-input" value={form.linkedIn} onChange={(e) => setForm({...form, linkedIn: e.target.value})} placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.isActive ? 'true' : 'false'} onChange={(e) => setForm({...form, isActive: e.target.value === 'true'})}>
                      <option value="true">Active (In Touch)</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Alumni</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail */}
      {viewAlumni && (
        <div className="form-overlay" onClick={() => setViewAlumni(null)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">Alumni Details</h3>
              <button className="form-close" onClick={() => setViewAlumni(null)}>×</button>
            </div>
            <div className="form-body">
              <div className="detail-grid">
                <div className="detail-field"><span className="detail-label">Name</span><span className="detail-value">{viewAlumni.studentId?.name || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Roll No</span><span className="detail-value">{viewAlumni.studentId?.rollNumber || '-'}</span></div>
                <div className="detail-field">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">
                    {viewAlumni.studentId?.email ? (
                      <a 
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${viewAlumni.studentId.email}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ textDecoration: 'underline' }}
                      >
                        {viewAlumni.studentId.email}
                      </a>
                    ) : '-'}
                  </span>
                </div>
                <div className="detail-field"><span className="detail-label">Phone</span><span className="detail-value">{viewAlumni.studentId?.phone || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Department</span><span className="detail-value">{viewAlumni.department}</span></div>
                <div className="detail-field"><span className="detail-label">Graduation Year</span><span className="detail-value">{viewAlumni.graduationYear}</span></div>
                <div className="detail-field"><span className="detail-label">Placed Company</span><span className="detail-value">{viewAlumni.companyId?.name || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Placement Role</span><span className="detail-value">{viewAlumni.placementId?.role || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Current Company</span><span className="detail-value">{viewAlumni.currentCompany || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Current Role</span><span className="detail-value">{viewAlumni.currentRole || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Package</span><span className="detail-value" style={{ color: 'var(--color-success)' }}>{viewAlumni.placementId?.package ? `₹${viewAlumni.placementId.package} LPA` : '-'}</span></div>
                <div className="detail-field"><span className="detail-label">LinkedIn</span><span className="detail-value">{viewAlumni.linkedIn ? <a href={viewAlumni.linkedIn} target="_blank" rel="noreferrer">{viewAlumni.linkedIn}</a> : '-'}</span></div>
                {viewAlumni.companyHistory && viewAlumni.companyHistory.length > 0 && (
                  <div className="detail-field" style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                    <span className="detail-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Employment History (Old Companies)</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--border-color)' }}>
                      {viewAlumni.companyHistory.map((history, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <span style={{ fontWeight: 600 }}>{history.company}</span> - <span style={{ color: 'var(--text-muted)' }}>{history.role || 'No Role'}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                            (Left on {new Date(history.changedAt).toLocaleDateString('en-IN')})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal title="Delete Alumni" message="Are you sure you want to delete this alumni record?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </>
  );
};

export default AlumniPage;
