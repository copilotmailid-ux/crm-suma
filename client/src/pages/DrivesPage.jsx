import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { getCompanies, getAllCompanies } from '../api/companyApi';
import ConfirmModal from '../components/common/ConfirmModal';
import CompanyDriveModal from '../components/common/CompanyDriveModal';
import Loader from '../components/common/Loader';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'];

const parseRoundsFromSelectionProcess = (selectionProcessStr, driveRounds = []) => {
  if (Array.isArray(driveRounds) && driveRounds.length > 0) {
    return driveRounds.map((r, idx) => {
      const rawName = r.name || `Round ${idx + 1}`;
      let dateStr = '';
      if (r.scheduledDate) {
        try {
          dateStr = new Date(r.scheduledDate).toISOString().split('T')[0];
        } catch {
          dateStr = String(r.scheduledDate).split('T')[0] || '';
        }
      }
      const cleanName = rawName.replace(/^Round\s*\d+\s*[:\-–]\s*/i, '').trim();
      return {
        name: cleanName || `Round ${idx + 1}`,
        date: dateStr,
      };
    });
  }

  if (!selectionProcessStr || !selectionProcessStr.trim()) {
    return [
      { name: 'Online Assessment', date: '' },
      { name: 'Technical Interview', date: '' },
      { name: 'HR Interview', date: '' },
    ];
  }

  const parts = selectionProcessStr
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return [
      { name: 'Online Assessment', date: '' },
      { name: 'Technical Interview', date: '' },
      { name: 'HR Interview', date: '' },
    ];
  }

  return parts.map((part, idx) => {
    let roundDate = '';
    let nameWithoutRound = part.replace(/^Round\s*\d+\s*[:\-–]\s*/i, '').trim();
    const dateMatch = nameWithoutRound.match(/\(([^)]+)\)$/);
    if (dateMatch) {
      const potentialDate = dateMatch[1].trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(potentialDate)) {
        roundDate = potentialDate;
        nameWithoutRound = nameWithoutRound.replace(/\(([^)]+)\)$/, '').trim();
      } else if (!isNaN(Date.parse(potentialDate))) {
        try {
          roundDate = new Date(potentialDate).toISOString().split('T')[0];
          nameWithoutRound = nameWithoutRound.replace(/\(([^)]+)\)$/, '').trim();
        } catch {
          // ignore
        }
      }
    }
    return {
      name: nameWithoutRound || `Round ${idx + 1}`,
      date: roundDate,
    };
  });
};

const formatSelectionProcessString = (rounds) => {
  if (!Array.isArray(rounds) || rounds.length === 0) {
    return '';
  }
  return rounds
    .map((r, idx) => {
      const name = (typeof r === 'object' && r !== null ? r.name : r) || `Round ${idx + 1}`;
      const date = typeof r === 'object' && r !== null ? r.date : '';
      const cleanName = String(name).trim() || `Round ${idx + 1}`;
      return date ? `Round ${idx + 1}: ${cleanName} (${date})` : `Round ${idx + 1}: ${cleanName}`;
    })
    .join(', ');
};

const emptyDriveForm = {
  companyId: '',
  companyName: '',
  visitNumber: 1,
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
  roundsList: [
    { name: 'Online Assessment', date: '' },
    { name: 'Technical Interview', date: '' },
    { name: 'HR Interview', date: '' },
  ],
  applicationLink: '',
};

const DrivesPage = () => {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [visitFilter, setVisitFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyDriveForm);
  const [deleteId, setDeleteId] = useState(null);
  const [viewDrive, setViewDrive] = useState(null);
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);
  const companyDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) {
        setShowCompanyList(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
  const debouncedSearch = useDebounce(search);

  const filteredCompanies = useMemo(() => {
    if (!companySearch || !companySearch.trim()) return companies;
    const q = companySearch.toLowerCase().trim();
    return companies.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.location?.toLowerCase().includes(q)
    );
  }, [companies, companySearch]);

  const fetchDrives = useCallback(async () => {
    setLoading(true);
    try {
      const params = { search: debouncedSearch, status: statusFilter };
      if (visitFilter) params.visitNumber = visitFilter;
      const res = await getDrives(params);
      setDrives(res.data);
    } catch {
      toast.error('Failed to fetch placement drives');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, visitFilter]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await getAllCompanies();
      const list = Array.isArray(res.data) ? res.data : (res.data.companies || []);
      setCompanies(list);
    } catch {
      try {
        const fallback = await getCompanies({ limit: 100 });
        setCompanies(fallback.data.companies || []);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const openCreateModal = () => {
    setEditId(null);
    const initialRounds = [
      { name: 'Online Assessment', date: '' },
      { name: 'Technical Interview', date: '' },
      { name: 'HR Interview', date: '' },
    ];
    setForm({
      ...emptyDriveForm,
      roundsList: initialRounds,
      selectionProcess: formatSelectionProcessString(initialRounds),
    });
    setCompanySearch('');
    setShowCompanyList(false);
    fetchCompanies();
    setShowModal(true);
  };

  const openEditModal = (drive) => {
    setEditId(drive._id);
    fetchCompanies();
    const cId = (drive.companyId?._id || drive.companyId)?.toString() || '';
    const rolesArr = drive.roles && drive.roles.length > 0 ? drive.roles : [drive.role || ''];
    const parsedRounds = parseRoundsFromSelectionProcess(drive.selectionProcess, drive.rounds);

    setForm({
      companyId: cId,
      companyName: drive.companyName || drive.companyId?.name || '',
      visitNumber: drive.visitNumber || 1,
      role: drive.role || '',
      roles: rolesArr,
      rolesInput: rolesArr.join(', '),
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
      selectionProcess: drive.selectionProcess || formatSelectionProcessString(parsedRounds),
      roundsList: parsedRounds,
      applicationLink: drive.applicationLink || '',
    });
    setCompanySearch('');
    setShowCompanyList(false);
    setShowModal(true);
  };

  const handleRoundNameChange = (index, newName) => {
    const updated = [...(form.roundsList || [])];
    const curr = typeof updated[index] === 'object' && updated[index] !== null
      ? updated[index]
      : { name: updated[index] || '', date: '' };
    updated[index] = { ...curr, name: newName };
    setForm((prev) => ({
      ...prev,
      roundsList: updated,
      selectionProcess: formatSelectionProcessString(updated),
    }));
  };

  const handleRoundDateChange = (index, newDate) => {
    const updated = [...(form.roundsList || [])];
    const curr = typeof updated[index] === 'object' && updated[index] !== null
      ? updated[index]
      : { name: updated[index] || '', date: '' };
    updated[index] = { ...curr, date: newDate };
    setForm((prev) => ({
      ...prev,
      roundsList: updated,
      selectionProcess: formatSelectionProcessString(updated),
    }));
  };

  const handleAddRound = (roundName = '', roundDate = '') => {
    const defaultName = roundName || `Technical Round ${(form.roundsList || []).length + 1}`;
    const updated = [...(form.roundsList || []), { name: defaultName, date: roundDate || '' }];
    setForm((prev) => ({
      ...prev,
      roundsList: updated,
      selectionProcess: formatSelectionProcessString(updated),
    }));
  };

  const handleRemoveRound = (index) => {
    if ((form.roundsList || []).length <= 1) {
      toast.error('At least one recruitment round is required');
      return;
    }
    const updated = (form.roundsList || []).filter((_, idx) => idx !== index);
    setForm((prev) => ({
      ...prev,
      roundsList: updated,
      selectionProcess: formatSelectionProcessString(updated),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName) {
      toast.error('Please select or enter a company name');
      return;
    }
    const rolesList = (form.rolesInput || form.role || '')
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    const primaryRole = rolesList[0] || form.role || 'Software Engineer';

    const activeRounds = (form.roundsList || [])
      .map((r) => {
        if (typeof r === 'object' && r !== null) {
          return { name: (r.name || '').trim(), date: r.date || '' };
        }
        return { name: String(r || '').trim(), date: '' };
      })
      .filter((r) => Boolean(r.name));

    const formattedSelectionProcess =
      activeRounds.length > 0
        ? formatSelectionProcessString(activeRounds)
        : form.selectionProcess || 'Round 1: Online Assessment';

    const payload = {
      ...form,
      role: primaryRole,
      roles: rolesList.length > 0 ? rolesList : [primaryRole],
      visitNumber: Number(form.visitNumber) || 1,
      selectionProcess: formattedSelectionProcess,
      roundsList: activeRounds,
    };

    try {
      if (editId) {
        await updateDrive(editId, payload);
        toast.success('Placement drive requirements updated! (Visible to students)');
      } else {
        await createDrive(payload);
        toast.success(`Placement drive entered for Visit ${payload.visitNumber}! (Now live on student side)`);
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

          <select
            className="filter-select"
            value={visitFilter}
            onChange={(e) => setVisitFilter(e.target.value)}
          >
            <option value="">All Campus Visits</option>
            <option value="1">Visit 1 Drives</option>
            <option value="2">Visit 2 Drives</option>
            <option value="3">Visit 3 Drives</option>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                        <span
                          className="badge badge-neutral"
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '10px',
                            background: d.visitNumber > 1 ? '#eff6ff' : '#f8fafc',
                            color: d.visitNumber > 1 ? '#1d4ed8' : '#475569',
                            border: d.visitNumber > 1 ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                          }}
                        >
                          Visit {d.visitNumber || 1}
                        </span>
                      </div>
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
                  <div className="form-group" ref={companyDropdownRef} style={{ position: 'relative' }}>
                    <label className="form-label">Company Name *</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <HiOutlineSearch
                        style={{
                          position: 'absolute',
                          left: '12px',
                          color: '#94a3b8',
                          fontSize: '1rem',
                          pointerEvents: 'none',
                          zIndex: 1,
                        }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{
                          width: '100%',
                          paddingLeft: '34px',
                          paddingRight: form.companyName ? '32px' : '14px',
                        }}
                        placeholder="e.g. Google, Zoho, Bosch"
                        value={form.companyName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = companies.find((c) => c.name?.toLowerCase() === val.toLowerCase());
                          setForm({
                            ...form,
                            companyName: val,
                            companyId: matched ? matched._id : '',
                          });
                          setCompanySearch(val);
                          setShowCompanyList(true);
                        }}
                        onFocus={() => {
                          setShowCompanyList(true);
                        }}
                        onClick={() => {
                          setShowCompanyList(true);
                        }}
                        required
                      />

                      {form.companyName && (
                        <button
                          type="button"
                          onClick={() => {
                            setForm({ ...form, companyName: '', companyId: '' });
                            setCompanySearch('');
                            setShowCompanyList(true);
                          }}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: 0,
                          }}
                          title="Clear company"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Floating Dropdown Menu (Absolute position so it never pushes down the form) */}
                    {showCompanyList && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          boxShadow: '0 12px 28px rgba(0, 0, 0, 0.16)',
                          maxHeight: '210px',
                          overflowY: 'auto',
                          zIndex: 9999,
                          padding: '4px',
                        }}
                      >
                        <div
                          style={{
                            padding: '6px 10px',
                            borderBottom: '1px solid #f1f5f9',
                            fontSize: '0.72rem',
                            color: '#64748b',
                            fontWeight: 600,
                          }}
                        >
                          <span>
                            {filteredCompanies.length} companies available
                            {companySearch ? ` matching "${companySearch}"` : ''}
                          </span>
                        </div>

                        {filteredCompanies.length === 0 ? (
                          <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                            No company matching &quot;{companySearch}&quot;
                          </div>
                        ) : (
                          filteredCompanies.map((c) => {
                            const isSelected =
                              form.companyId === c._id ||
                              form.companyName?.toLowerCase() === c.name?.toLowerCase();

                            return (
                              <div
                                key={c._id}
                                onClick={() => {
                                  // Auto-detect next visit number if company visited before!
                                  const existingDrivesForComp = drives.filter(
                                    (d) =>
                                      (d.companyId?._id || d.companyId)?.toString() === c._id?.toString() ||
                                      d.companyName?.toLowerCase() === c.name?.toLowerCase()
                                  );
                                  const autoVisit = existingDrivesForComp.length > 0
                                    ? existingDrivesForComp.length + 1
                                    : (c.visits || 1);

                                  setForm({
                                    ...form,
                                    companyId: c._id,
                                    companyName: c.name,
                                    visitNumber: autoVisit,
                                    jobLocation:
                                      form.jobLocation && form.jobLocation !== 'Pan India / Hybrid'
                                        ? form.jobLocation
                                        : c.location || 'Pan India / Hybrid',
                                  });
                                  setCompanySearch('');
                                  setShowCompanyList(false);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  background: isSelected ? '#f0fdf4' : 'transparent',
                                  borderBottom: '1px solid #f8fafc',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = '#f1f5f9';
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      fontSize: '0.86rem',
                                      color: isSelected ? '#15803d' : '#0f172a',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                  >
                                    {c.name}
                                  </div>
                                  {c.industry && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                      🏷️ {c.industry} {c.location ? `• ${c.location}` : ''}
                                    </div>
                                  )}
                                </div>

                                {isSelected && (
                                  <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 800 }}>
                                    ✓
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ flex: '0 0 160px' }}>
                    <label className="form-label">Campus Visit *</label>
                    <select
                      className="form-select"
                      value={form.visitNumber || 1}
                      onChange={(e) => setForm({ ...form, visitNumber: Number(e.target.value) })}
                    >
                      <option value={1}>Visit 1</option>
                      <option value={2}>Visit 2</option>
                      <option value={3}>Visit 3</option>
                      <option value={4}>Visit 4</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">
                      Job Roles Offered * (Multiple roles allowed, separated by commas)
                    </label>
                    <input
                      className="form-input"
                      placeholder="e.g. Software Engineer, Cloud Trainee, Data Analyst"
                      value={form.rolesInput !== undefined ? form.rolesInput : form.role}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm({
                          ...form,
                          rolesInput: val,
                          role: val.split(',')[0]?.trim() || '',
                        });
                      }}
                      required
                    />
                    {/* Role Chips Preview */}
                    {form.rolesInput && form.rolesInput.includes(',') && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {form.rolesInput.split(',').map((r) => r.trim()).filter(Boolean).map((r, i) => (
                          <span
                            key={i}
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                            }}
                          >
                            Role {i + 1}: {r}
                          </span>
                        ))}
                      </div>
                    )}
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
                      onChange={(e) => {
                        const newDriveDate = e.target.value;
                        setForm((prev) => {
                          const updatedRounds = [...(prev.roundsList || [])];
                          if (updatedRounds.length > 0) {
                            const r0 = typeof updatedRounds[0] === 'object' && updatedRounds[0] !== null
                              ? updatedRounds[0]
                              : { name: updatedRounds[0] || 'Online Assessment', date: '' };
                            if (!r0.date || r0.date === prev.driveDate) {
                              updatedRounds[0] = { ...r0, date: newDriveDate };
                            }
                          }
                          return {
                            ...prev,
                            driveDate: newDriveDate,
                            roundsList: updatedRounds,
                            selectionProcess: formatSelectionProcessString(updatedRounds),
                          };
                        });
                      }}
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

                {/* Dynamic Selection Process & Recruitment Rounds */}
                <div
                  className="form-group"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginTop: '4px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 800, color: '#0b1d37', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎯</span> Selection Process & Recruitment Rounds
                      </label>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        Add, remove, or customize the interview stages for this drive
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddRound('')}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        gap: '6px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#0b1d37',
                      }}
                    >
                      <HiOutlinePlus style={{ color: '#0284c7' }} /> Add Round
                    </button>
                  </div>

                  {/* List of Rounds */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(form.roundsList || []).map((roundItem, idx) => {
                      const roundName = typeof roundItem === 'object' && roundItem !== null ? roundItem.name : roundItem;
                      const roundDate = typeof roundItem === 'object' && roundItem !== null ? roundItem.date : '';

                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            flexWrap: 'wrap',
                          }}
                        >
                          {/* Round Number Badge */}
                          <div
                            style={{
                              background: '#0b1d37',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              minWidth: '78px',
                              justifyContent: 'center',
                            }}
                          >
                            <span>Round {idx + 1}</span>
                          </div>

                          {/* Round Name Input */}
                          <input
                            type="text"
                            className="form-input"
                            style={{
                              flex: '1 1 180px',
                              padding: '8px 12px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              minWidth: '140px',
                            }}
                            placeholder={`e.g. ${idx === 0 ? 'Online Assessment' : idx === 1 ? 'Technical Interview' : 'HR Discussion'}`}
                            value={roundName}
                            onChange={(e) => handleRoundNameChange(idx, e.target.value)}
                            required
                          />

                          {/* Round Scheduled Date Input */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              flexShrink: 0,
                            }}
                          >
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                              📅 Date:
                            </span>
                            <input
                              type="date"
                              className="form-input"
                              style={{
                                width: '135px',
                                padding: '4px 8px',
                                fontSize: '0.78rem',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                background: '#ffffff',
                              }}
                              title={`Scheduled Date for Round ${idx + 1}`}
                              value={roundDate || ''}
                              onChange={(e) => handleRoundDateChange(idx, e.target.value)}
                            />
                          </div>

                          {/* Remove Round Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveRound(idx)}
                            disabled={(form.roundsList || []).length <= 1}
                            title={(form.roundsList || []).length <= 1 ? 'At least one round required' : 'Remove this round'}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: (form.roundsList || []).length <= 1 ? '#cbd5e1' : '#ef4444',
                              cursor: (form.roundsList || []).length <= 1 ? 'not-allowed' : 'pointer',
                              padding: '6px',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.1rem',
                              transition: 'all 0.15s ease',
                              marginLeft: 'auto',
                            }}
                            onMouseEnter={(e) => {
                              if ((form.roundsList || []).length > 1) {
                                e.currentTarget.style.background = '#fee2e2';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'none';
                            }}
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                      ⚡ Quick Add Common Rounds:
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        'Online Assessment',
                        'Coding Round',
                        'Technical Interview',
                        'Group Discussion',
                        'System Design',
                        'HR Interview',
                        'Managerial Round',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleAddRound(preset)}
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 9px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#0b1d37';
                            e.currentTarget.style.color = '#0b1d37';
                            e.currentTarget.style.background = '#f1f5f9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.color = '#334155';
                            e.currentTarget.style.background = '#ffffff';
                          }}
                        >
                          <span>+</span> {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Progression Pipeline Preview */}
                  {(form.roundsList || []).length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.74rem',
                        color: '#475569',
                      }}
                    >
                      <strong style={{ color: '#0b1d37' }}>Pipeline Preview: </strong>
                      {(form.roundsList || []).map((r, i) => {
                        const name = (typeof r === 'object' && r !== null ? r.name : r) || '(Untitled)';
                        const date = typeof r === 'object' && r !== null ? r.date : '';
                        return (
                          <span key={i}>
                            <span style={{ fontWeight: 700, color: '#b45309' }}>Round {i + 1}</span>: {name}
                            {date && (
                              <span style={{ color: '#0284c7', fontWeight: 600, marginLeft: '4px' }}>
                                ({date.split('-').reverse().join('/')})
                              </span>
                            )}
                            {i < (form.roundsList || []).length - 1 && (
                              <span style={{ margin: '0 6px', color: '#94a3b8' }}>→</span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  )}
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
