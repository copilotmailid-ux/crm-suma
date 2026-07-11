import { useState, useEffect, useCallback } from 'react';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineBriefcase, HiOutlineX } from 'react-icons/hi';
import { getPlacements, createPlacement, updatePlacement, deletePlacement } from '../api/placementApi';
import { getStudents } from '../api/studentApi';
import { getAllCompanies } from '../api/companyApi';
import ExportButtons from '../components/common/ExportButtons';
import ConfirmModal from '../components/common/ConfirmModal';
import Loader from '../components/common/Loader';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AIDS', 'AIML', 'Other'];

const emptyForm = {
  studentId: '', companyId: '', role: '', package: '',
  placementDate: '', offerType: 'on_campus', status: 'offered',
};

const PlacementsPage = () => {
  const [placements, setPlacements] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterDept, setFilterDept] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterOfferType, setFilterOfferType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [viewPlacement, setViewPlacement] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300);

  const fetchPlacements = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterDept) params.department = filterDept;
      if (filterCompany) params.companyId = filterCompany;
      if (filterOfferType) params.offerType = filterOfferType;
      const res = await getPlacements(params);
      setPlacements(res.data.placements);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to fetch placements');
    } finally {
      setLoading(false);
    }
  }, [page, filterDept, filterCompany, filterOfferType]);

  useEffect(() => { fetchPlacements(); }, [fetchPlacements]);

  useEffect(() => {
    getAllCompanies().then(res => setAllCompanies(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (showForm || viewPlacement || deleteId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm, viewPlacement, deleteId]);

  // Search students for dropdown
  useEffect(() => {
    if (showForm) {
      const params = { limit: 50, status: 'not_placed' };
      if (debouncedStudentSearch) params.search = debouncedStudentSearch;
      getStudents(params).then(res => setAllStudents(res.data.students)).catch(() => {});
    }
  }, [showForm, debouncedStudentSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, package: parseFloat(form.package) };
      if (editId) {
        await updatePlacement(editId, data);
        toast.success('Placement updated');
      } else {
        await createPlacement(data);
        toast.success('Placement recorded! Student marked as placed & alumni record created.');
      }
      closeForm();
      fetchPlacements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deletePlacement(deleteId);
      toast.success('Placement deleted. Student status reverted.');
      setDeleteId(null);
      fetchPlacements();
    } catch {
      toast.error('Failed to delete placement');
    }
  };

  const openEdit = (placement) => {
    setEditId(placement._id);
    setForm({
      studentId: placement.studentId?._id || '',
      companyId: placement.companyId?._id || '',
      role: placement.role,
      package: placement.package,
      placementDate: placement.placementDate ? placement.placementDate.split('T')[0] : '',
      offerType: placement.offerType,
      status: placement.status,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
    setStudentSearch('');
  };

  const statusBadge = (status) => {
    const map = {
      offered: 'badge-warning',
      accepted: 'badge-info',
      joined: 'badge-success',
      rejected: 'badge-error',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  const handleExportData = async () => {
    try {
      const params = { page: 1, limit: 1000000 };
      if (filterDept) params.department = filterDept;
      if (filterCompany) params.companyId = filterCompany;
      if (filterOfferType) params.offerType = filterOfferType;
      const res = await getPlacements(params);
      return res.data.placements;
    } catch {
      toast.error('Failed to fetch full data for export');
      return [];
    }
  };

  const exportColumns = [
    { header: 'Student', accessor: (r) => r.studentId?.name || '-' },
    { header: 'Roll No', accessor: (r) => r.studentId?.rollNumber || '-' },
    { header: 'Department', accessor: (r) => r.studentId?.department || '-' },
    { header: 'Company', accessor: (r) => r.companyId?.name || '-' },
    { header: 'Role', accessor: (r) => r.role },
    { header: 'Package (LPA)', accessor: (r) => r.package },
    { header: 'Offer Type', accessor: (r) => r.offerType === 'on_campus' ? 'On Campus' : 'Off Campus' },
    { header: 'Status', accessor: (r) => r.status },
    { header: 'Date', accessor: (r) => new Date(r.placementDate).toLocaleDateString('en-IN') },
  ];

  return (
    <>
      <div className="page-header">
        <h2 className="page-header-title">Placements</h2>
        <div className="page-header-actions">
          <ExportButtons onExport={handleExportData} columns={exportColumns} filename="placements" title="Placements Report" />
          <button className="btn btn-primary" onClick={() => setShowForm(true)} id="add-placement-btn">
            <HiOutlinePlus /> Record Placement
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-left">
          <select className="filter-select" value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="filter-select" value={filterCompany} onChange={(e) => { setFilterCompany(e.target.value); setPage(1); }}>
            <option value="">All Companies</option>
            {allCompanies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="filter-select" value={filterOfferType} onChange={(e) => { setFilterOfferType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="on_campus">On Campus</option>
            <option value="off_campus">Off Campus</option>
          </select>
          {(filterDept || filterCompany || filterOfferType) && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                setFilterDept('');
                setFilterCompany('');
                setFilterOfferType('');
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
                  <th>Student</th>
                  <th>Roll No</th>
                  <th>Dept</th>
                  <th>Company</th>
                  <th>Role</th>
                  <th>Package (LPA)</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {placements.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="empty-state">
                        <div className="empty-icon"><HiOutlineBriefcase /></div>
                        <p className="empty-title">No placements recorded</p>
                        <p className="empty-text">Record your first placement by clicking the button above</p>
                      </div>
                    </td>
                  </tr>
                ) : placements.map((p) => (
                  <tr key={p._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.studentId?.name || '-'}</td>
                    <td>{p.studentId?.rollNumber || '-'}</td>
                    <td><span className="badge badge-info">{p.studentId?.department || '-'}</span></td>
                    <td style={{ color: 'var(--text-primary)' }}>{p.companyId?.name || '-'}</td>
                    <td>{p.role}</td>
                    <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>₹{p.package}</td>
                    <td><span className="badge badge-neutral">{p.offerType === 'on_campus' ? 'On Campus' : 'Off Campus'}</span></td>
                    <td>{statusBadge(p.status)}</td>
                    <td>{new Date(p.placementDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon btn-secondary" onClick={() => setViewPlacement(p)} title="View"><HiOutlineEye /></button>
                        <button className="btn-icon btn-secondary" onClick={() => openEdit(p)} title="Edit"><HiOutlinePencil /></button>
                        <button className="btn-icon btn-danger" onClick={() => setDeleteId(p._id)} title="Delete"><HiOutlineTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">Showing {placements.length} of {total} placements</span>
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

      {/* Form Modal */}
      {showForm && (
        <div className="form-overlay" onClick={closeForm}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">{editId ? 'Edit Placement' : 'Record New Placement'}</h3>
              <button className="form-close" onClick={closeForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-body">
                {!editId && (
                  <div className="form-group">
                    <label className="form-label">Search & Select Student *</label>
                    <input
                      className="form-input"
                      placeholder="Type to search unplaced students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{ marginBottom: 8 }}
                    />
                    <select className="form-select" value={form.studentId} onChange={(e) => setForm({...form, studentId: e.target.value})} required size={4} style={{ height: 'auto' }}>
                      <option value="">-- Select Student --</option>
                      {allStudents.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.rollNumber}) - {s.department}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <select className="form-select" value={form.companyId} onChange={(e) => setForm({...form, companyId: e.target.value})} required>
                    <option value="">Select Company</option>
                    {allCompanies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role / Designation *</label>
                    <input className="form-input" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} required placeholder="SDE" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Package (LPA) *</label>
                    <input className="form-input" type="number" step="0.01" min="0" value={form.package} onChange={(e) => setForm({...form, package: e.target.value})} required placeholder="12.5" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Placement Date *</label>
                    <input className="form-input" type="date" value={form.placementDate} onChange={(e) => setForm({...form, placementDate: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Offer Type</label>
                    <select className="form-select" value={form.offerType} onChange={(e) => setForm({...form, offerType: e.target.value})}>
                      <option value="on_campus">On Campus</option>
                      <option value="off_campus">Off Campus</option>
                    </select>
                  </div>
                </div>
                {editId && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                      <option value="offered">Offered</option>
                      <option value="accepted">Accepted</option>
                      <option value="joined">Joined</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Record Placement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail */}
      {viewPlacement && (
        <div className="form-overlay" onClick={() => setViewPlacement(null)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">Placement Details</h3>
              <button className="form-close" onClick={() => setViewPlacement(null)}>×</button>
            </div>
            <div className="form-body">
              <div className="detail-grid">
                <div className="detail-field"><span className="detail-label">Student</span><span className="detail-value">{viewPlacement.studentId?.name || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Roll No</span><span className="detail-value">{viewPlacement.studentId?.rollNumber || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Department</span><span className="detail-value">{viewPlacement.studentId?.department || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Company</span><span className="detail-value">{viewPlacement.companyId?.name || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Role</span><span className="detail-value">{viewPlacement.role}</span></div>
                <div className="detail-field"><span className="detail-label">Package</span><span className="detail-value" style={{ color: 'var(--color-success)', fontWeight: 600 }}>₹{viewPlacement.package} LPA</span></div>
                <div className="detail-field"><span className="detail-label">Offer Type</span><span className="detail-value">{viewPlacement.offerType === 'on_campus' ? 'On Campus' : 'Off Campus'}</span></div>
                <div className="detail-field"><span className="detail-label">Status</span>{statusBadge(viewPlacement.status)}</div>
                <div className="detail-field"><span className="detail-label">Date</span><span className="detail-value">{new Date(viewPlacement.placementDate).toLocaleDateString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal title="Delete Placement" message="Deleting this placement will revert the student's status to 'Not Placed' and remove the alumni record." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </>
  );
};

export default PlacementsPage;
