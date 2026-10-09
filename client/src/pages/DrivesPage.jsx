import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineSearch,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineCash,
  HiOutlineBriefcase,
} from 'react-icons/hi';
import { getDrives, createDrive, updateDrive, deleteDrive } from '../api/driveApi';
import { getCompanies } from '../api/companyApi';
import ConfirmModal from '../components/common/ConfirmModal';
import CompanyDriveModal from '../components/common/CompanyDriveModal';
import Loader from '../components/common/Loader';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'];

const emptyDriveForm = {
  companyName: '',
  role: '',
  package: '',
  jobLocation: 'Pan India / Hybrid',
  eligibleDepartments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
  minCgpa: '6.5',
  maxCurrentArrears: '0',
  minTenthMarks: '60',
  minTwelfthMarks: '60',
  driveDate: '',
  registrationDeadline: '',
  status: 'Upcoming',
  jobDescription: '',
  selectionProcess: 'Round 1: Online Assessment, Round 2: Technical Interview, Round 3: HR Interview',
  applicationLink: '',
};

const DrivesPage = () => {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyDriveForm);
  const [deleteId, setDeleteId] = useState(null);
  const [viewDrive, setViewDrive] = useState(null);
  const debouncedSearch = useDebounce(search);

  const fetchDrives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDrives({ search: debouncedSearch, status: statusFilter });
      setDrives(res.data);
    } catch {
      toast.error('Failed to fetch placement drives');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  useEffect(() => {
    getCompanies({ limit: 100 })
      .then((res) => setCompanies(res.data.companies || []))
      .catch(() => {});
  }, []);

  const openCreateModal = () => {
    setEditId(null);
    setForm(emptyDriveForm);
    setShowModal(true);
  };

  const openEditModal = (drive) => {
    setEditId(drive._id);
    setForm({
      companyName: drive.companyName,
      role: drive.role,
      package: drive.package,
      jobLocation: drive.jobLocation || '',
      eligibleDepartments: drive.eligibleDepartments || [],
      minCgpa: drive.minCgpa || '',
      maxCurrentArrears: drive.maxCurrentArrears !== undefined ? drive.maxCurrentArrears : '0',
      minTenthMarks: drive.minTenthMarks || '60',
      minTwelfthMarks: drive.minTwelfthMarks || '60',
      driveDate: drive.driveDate ? drive.driveDate.split('T')[0] : '',
      registrationDeadline: drive.registrationDeadline ? drive.registrationDeadline.split('T')[0] : '',
      status: drive.status || 'Upcoming',
      jobDescription: drive.jobDescription || '',
      selectionProcess: drive.selectionProcess || '',
      applicationLink: drive.applicationLink || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDrive(editId, form);
        toast.success('Placement drive requirements updated! (Visible to students)');
      } else {
        await createDrive(form);
        toast.success('New placement drive entered! (Now live on student side)');
      }
      setShowModal(false);
      fetchDrives();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDrive(deleteId);
      toast.success('Drive deleted');
      setDeleteId(null);
      fetchDrives();
    } catch {
      toast.error('Failed to delete drive');
    }
  };

  const toggleDept = (dept) => {
    const list = form.eligibleDepartments || [];
    if (list.includes(dept)) {
      setForm({ ...form, eligibleDepartments: list.filter((d) => d !== dept) });
    } else {
      setForm({ ...form, eligibleDepartments: [...list, dept] });
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 className="page-header-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Company Placement Drives</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Enter visiting companies and eligibility criteria. These requirements are shown directly on the student portal.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} id="btn-add-drive" style={{ whiteSpace: 'nowrap' }}>
          <HiOutlinePlus /> Enter Company Requirements
        </button>
      </div>

      {/* Toolbar */}
      <div className="table-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
          <div className="search-box" style={{ maxWidth: '320px', width: '100%' }}>
            <HiOutlineSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Drives Table */}
      {loading ? (
        <Loader />
      ) : drives.length === 0 ? (
        <div className="empty-state">
          <p>No company placement drives entered yet. Click "Enter Company Requirements" to add one.</p>
        </div>
      ) : (
        <div className="data-table-wrapper" style={{ width: '100%', overflow: 'hidden' }}>
          <div className="table-scroll" style={{ width: '100%', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ minWidth: '130px' }}>Company</th>
                  <th style={{ minWidth: '150px' }}>Role</th>
                  <th style={{ minWidth: '85px' }}>Package</th>
                  <th style={{ minWidth: '70px', textAlign: 'center' }}>Min CGPA</th>
                  <th style={{ minWidth: '80px', textAlign: 'center' }}>Max Arrears</th>
                  <th style={{ minWidth: '120px' }}>Eligible Depts</th>
                  <th style={{ minWidth: '95px' }}>Drive Date</th>
                  <th style={{ minWidth: '85px' }}>Status</th>
                  <th style={{ minWidth: '85px', textAlign: 'center' }}>Registered</th>
                  <th style={{ width: '96px', minWidth: '96px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((d) => (
                  <tr key={d._id}>
                    <td
                      style={{ fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setViewDrive(d)}
                      title="Click company to view registered & eligible candidates"
                    >
                      <span
                        style={{
                          color: '#0f172a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#c59e51';
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#0f172a';
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {d.companyName}
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>↗</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{d.role}</td>
                    <td>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        ₹{d.package} LPA
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{d.minCgpa || 'Any'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${d.maxCurrentArrears === 0 ? 'badge-neutral' : 'badge-warning'}`}>
                        {d.maxCurrentArrears ?? 0}
                      </span>
                    </td>
                    <td
                      style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={d.eligibleDepartments?.join(', ')}
                    >
                      {d.eligibleDepartments && d.eligibleDepartments.length > 0 ? (
                        <span>
                          {d.eligibleDepartments.slice(0, 3).join(', ')}
                          {d.eligibleDepartments.length > 3 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '4px' }}>
                              +{d.eligibleDepartments.length - 3}
                            </span>
                          )}
                        </span>
                      ) : (
                        'All Depts'
                      )}
                    </td>
                    <td>{new Date(d.driveDate).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span
                        className={`badge ${
                          d.status === 'Completed'
                            ? 'badge-neutral'
                            : d.status === 'Ongoing'
                            ? 'badge-success'
                            : 'badge-warning'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td
                      style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => setViewDrive(d)}
                      title="Click to view registered candidates"
                    >
                      <span
                        className="badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: (d.registeredStudents?.length || 0) > 0 ? 'rgba(11, 29, 55, 0.08)' : 'var(--bg-input, #f1f5f9)',
                          color: (d.registeredStudents?.length || 0) > 0 ? '#0b1d37' : 'var(--text-muted, #64748b)',
                          fontWeight: 700,
                          padding: '3px 8px',
                          cursor: 'pointer',
                          border: (d.registeredStudents?.length || 0) > 0 ? '1px solid rgba(11, 29, 55, 0.2)' : '1px solid transparent',
                        }}
                      >
                        <HiOutlineUserGroup /> {d.registeredStudents?.length || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', width: '96px' }}>
                      <div className="table-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button
                          className="btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title="View Candidates & Rounds"
                          onClick={() => setViewDrive(d)}
                        >
                          <HiOutlineEye style={{ fontSize: '0.9rem' }} />
                        </button>
                        <button
                          className="btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title="Edit Drive Requirements"
                          onClick={() => openEditModal(d)}
                        >
                          <HiOutlinePencil style={{ fontSize: '0.9rem' }} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          style={{ width: '28px', height: '28px' }}
                          title="Delete Drive"
                          onClick={() => setDeleteId(d._id)}
                        >
                          <HiOutlineTrash style={{ fontSize: '0.9rem' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Drive Modal */}
      {showModal && (
        <div className="form-overlay" onClick={() => setShowModal(false)}>
          <div className="form-modal" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">
                {editId ? 'Edit Placement Drive Requirements' : 'Enter Company Placement Requirements'}
              </h3>
              <button className="form-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Google, Zoho, Bosch"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      required
                      list="companies-list"
                    />
                    <datalist id="companies-list">
                      {companies.map((c) => (
                        <option key={c._id} value={c.name} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Role / Designation *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Software Engineer, Cloud Trainee"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Annual Package (CTC in LPA) *</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-input"
                      placeholder="e.g. 14.5"
                      value={form.package}
                      onChange={(e) => setForm({ ...form, package: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Location</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Bangalore, Chennai, Hybrid"
                      value={form.jobLocation}
                      onChange={(e) => setForm({ ...form, jobLocation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Minimum CGPA Criteria</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      className="form-input"
                      placeholder="e.g. 7.5"
                      value={form.minCgpa}
                      onChange={(e) => setForm({ ...form, minCgpa: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Standing Live Arrears Allowed</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      value={form.maxCurrentArrears}
                      onChange={(e) => setForm({ ...form, maxCurrentArrears: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Drive Date *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.driveDate}
                      onChange={(e) => setForm({ ...form, driveDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Registration Deadline *</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.registrationDeadline}
                      onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Eligible Departments</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {DEPARTMENTS.map((dept) => {
                      const isSelected = form.eligibleDepartments?.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => toggleDept(dept)}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {dept}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Selection Process & Rounds</label>
                  <input
                    className="form-input"
                    placeholder="Round 1: Online Test, Round 2: Tech Interview, Round 3: HR"
                    value={form.selectionProcess}
                    onChange={(e) => setForm({ ...form, selectionProcess: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Description / Requirements</label>
                  <textarea
                    rows={3}
                    className="form-input"
                    placeholder="Job responsibilities, required technical skills, bond details..."
                    value={form.jobDescription}
                    onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Drive Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">External Registration Link (Optional)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://forms.gle/..."
                      value={form.applicationLink}
                      onChange={(e) => setForm({ ...form, applicationLink: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editId ? 'Save Requirements' : 'Publish Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Drive Applicants & Eligible Students Modal */}
      {viewDrive && (
        <CompanyDriveModal
          drive={viewDrive}
          onClose={() => {
            setViewDrive(null);
            fetchDrives();
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <ConfirmModal
          title="Delete Placement Drive"
          message="Are you sure you want to delete this placement drive? Students will no longer see it."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
};

export default DrivesPage;
