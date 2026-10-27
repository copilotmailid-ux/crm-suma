import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineBriefcase,
  HiOutlineX,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineTrendingUp,
} from 'react-icons/hi';
import { getPlacements, createPlacement, updatePlacement, deletePlacement } from '../api/placementApi';
import { getStudents } from '../api/studentApi';
import { getAllCompanies } from '../api/companyApi';
import { getBatchWise } from '../api/dashboardApi';
import ExportButtons from '../components/common/ExportButtons';
import ConfirmModal from '../components/common/ConfirmModal';
import Loader from '../components/common/Loader';
import StudentDetailModal from '../components/common/StudentDetailModal';
import { useDebounce } from '../hooks/useDebounce';
import { getCurrentFinalYearBatch, isBatchEligibleForPlacement } from '../utils/batchUtils';
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
  const [filterBatch, setFilterBatch] = useState(() => getCurrentFinalYearBatch()); // Preferred first: Current final year batch
  const [batchStats, setBatchStats] = useState([]);
  const [filterDept, setFilterDept] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterOfferType, setFilterOfferType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [viewPlacement, setViewPlacement] = useState(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 300);

  // Fetch unique batches with their student counts and placed counts
  const refreshBatchStats = useCallback(() => {
    getBatchWise()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setBatchStats(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshBatchStats();
  }, [refreshBatchStats]);

  // Dynamic Current Final Year Batch (Switches every upcoming year after the month of May)
  const currentFinalYearBatch = useMemo(() => {
    const dynamicBatch = getCurrentFinalYearBatch();
    if (!batchStats || batchStats.length === 0) return dynamicBatch;
    const found = batchStats.find((b) => b.batch === dynamicBatch);
    return found ? found.batch : dynamicBatch;
  }, [batchStats]);

  // Only batches eligible for placements: Current final year batch + previous graduating batches.
  // Junior batches (graduating after current final year) enter placement only in their final year.
  const placementBatches = useMemo(() => {
    return (batchStats || []).filter(
      (b) =>
        isBatchEligibleForPlacement(b.batch) &&
        (b.batch === currentFinalYearBatch || (b.placed && b.placed > 0))
    );
  }, [batchStats, currentFinalYearBatch]);

  const allStats = useMemo(() => {
    const totalCount = placementBatches.reduce((acc, b) => acc + (b.total || 0), 0);
    const placedCount = placementBatches.reduce((acc, b) => acc + (b.placed || 0), 0);
    const rate = totalCount > 0 ? ((placedCount / totalCount) * 100).toFixed(1) : '0.0';
    return { total: totalCount, placed: placedCount, rate };
  }, [placementBatches]);

  const finalYearStat = useMemo(() => {
    return placementBatches.find((b) => b.batch === currentFinalYearBatch);
  }, [placementBatches, currentFinalYearBatch]);

  const otherBatches = useMemo(() => {
    return placementBatches
      .filter((b) => b.batch !== currentFinalYearBatch)
      .sort((a, b) => b.batch.localeCompare(a.batch));
  }, [placementBatches, currentFinalYearBatch]);

  const activeStats = useMemo(() => {
    if (!filterBatch) {
      return allStats;
    }
    const match = placementBatches.find((b) => b.batch === filterBatch);
    if (!match) return { total: 0, placed: 0, rate: '0.0' };
    const rate = match.total > 0 ? ((match.placed / match.total) * 100).toFixed(1) : '0.0';
    return { total: match.total, placed: match.placed, rate };
  }, [filterBatch, placementBatches, allStats]);

  const fetchPlacements = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterBatch) params.batch = filterBatch;
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
  }, [page, filterBatch, filterDept, filterCompany, filterOfferType]);

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

  // Search students for dropdown (only eligible graduating final-year students can be placed)
  useEffect(() => {
    if (showForm) {
      const params = { limit: 50, status: 'not_placed', batch: currentFinalYearBatch };
      if (debouncedStudentSearch) params.search = debouncedStudentSearch;
      getStudents(params).then(res => setAllStudents(res.data.students)).catch(() => {});
    }
  }, [showForm, debouncedStudentSearch, currentFinalYearBatch]);

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
      refreshBatchStats();
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
      refreshBatchStats();
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
    return (
      <span
        className={`badge ${map[status] || 'badge-neutral'}`}
        style={{ padding: '2px 6px', fontSize: '0.68rem', textTransform: 'capitalize', whiteSpace: 'nowrap' }}
      >
        {status}
      </span>
    );
  };

  const handleExportData = async () => {
    try {
      const params = { page: 1, limit: 1000000 };
      if (filterBatch) params.batch = filterBatch;
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
    { header: 'Batch', accessor: (r) => r.studentId?.batch || '-' },
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
        <div>
          <h2 className="page-header-title">Placements</h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Batch-wise student placement records, company offers & recruitment milestones
          </p>
        </div>
        <div className="page-header-actions">
          <ExportButtons onExport={handleExportData} columns={exportColumns} filename="placements" title="Placements Report" />
          <button className="btn btn-primary" onClick={() => setShowForm(true)} id="add-placement-btn">
            <HiOutlinePlus /> Record Placement
          </button>
        </div>
      </div>

      {/* Batch Placement Highlights / Quick Stats Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(11, 29, 55, 0.08)', color: 'var(--accent-start, #0b1d37)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
            <HiOutlineAcademicCap />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Selected Batch
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>{filterBatch || 'All Batches'}</span>
              {filterBatch === currentFinalYearBatch && (
                <span style={{ fontSize: '0.64rem', background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '1px 6px', borderRadius: '4px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ★ Final Year
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
            <HiOutlineUserGroup />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Batch Strength (Total)
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {activeStats.total} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Students</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
            <HiOutlineCheckCircle />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Placed Students
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669' }}>
              {activeStats.placed} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>({activeStats.rate}%)</span>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(197, 158, 81, 0.15)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 }}>
            <HiOutlineTrendingUp />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Placement Offers
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {total} <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Offers Recorded</span>
            </div>
          </div>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-left">
          {/* Batch Filter - Current Final Year Preferred First */}
          <select
            className="filter-select"
            value={filterBatch}
            onChange={(e) => {
              setFilterBatch(e.target.value);
              setPage(1);
            }}
            style={{
              fontWeight: 700,
              minWidth: '260px',
              border: filterBatch === currentFinalYearBatch ? '1.5px solid #c59e51' : '1px solid var(--border-color)',
              background: filterBatch === currentFinalYearBatch ? 'rgba(197, 158, 81, 0.06)' : 'var(--bg-card)',
            }}
            title="Filter by Batch (Current final year preferred first)"
          >
            {/* Preferred first: Current Final Year Batch */}
            {finalYearStat ? (
              <option value={finalYearStat.batch}>
                ★ {finalYearStat.batch} (Current Final Yr) — {finalYearStat.placed}/{finalYearStat.total} Placed ({((finalYearStat.placed / finalYearStat.total) * 100).toFixed(0)}%)
              </option>
            ) : (
              <option value={currentFinalYearBatch}>★ {currentFinalYearBatch} (Current Final Yr)</option>
            )}

            <option value="">
              All Batches ({allStats.placed}/{allStats.total} Placed)
            </option>

            {otherBatches.map((b) => {
              const pct = b.total > 0 ? ((b.placed / b.total) * 100).toFixed(0) : 0;
              return (
                <option key={b.batch} value={b.batch}>
                  {b.batch} — {b.placed}/{b.total} Placed ({pct}%)
                </option>
              );
            })}
          </select>

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

          {/* Quick button to jump back to current final year batch if another batch or all is selected */}
          {filterBatch !== currentFinalYearBatch && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFilterBatch(currentFinalYearBatch);
                setPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#fef3c7',
                color: '#92400e',
                border: '1px solid #fde68a',
                padding: '7px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-sm)',
              }}
              title="Quick switch to current final year batch"
            >
              ★ Final Year ({currentFinalYearBatch})
            </button>
          )}

          {(filterBatch || filterDept || filterCompany || filterOfferType) && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                setFilterBatch('');
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
        <div className="data-table-wrapper" style={{ overflowX: 'hidden', width: '100%' }}>
          <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '14%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '6%' }} />
            </colgroup>
            <thead>
              <tr>
                <th style={{ padding: '11px 8px', fontSize: '0.72rem' }}>Student</th>
                <th style={{ padding: '11px 4px', fontSize: '0.72rem' }}>Roll No</th>
                <th style={{ padding: '11px 4px', fontSize: '0.72rem' }}>Batch</th>
                <th style={{ padding: '11px 4px', fontSize: '0.72rem' }}>Dept</th>
                <th style={{ padding: '11px 6px', fontSize: '0.72rem' }}>Company</th>
                <th style={{ padding: '11px 6px', fontSize: '0.72rem' }}>Role</th>
                <th style={{ padding: '11px 4px', fontSize: '0.72rem', textAlign: 'center' }}>Package</th>
                <th style={{ padding: '11px 4px', fontSize: '0.72rem', textAlign: 'center' }}>Type</th>
                <th style={{ padding: '11px 4px', fontSize: '0.72rem', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '11px 4px', fontSize: '0.72rem', textAlign: 'center' }}>Date</th>
                <th style={{ padding: '11px 4px', fontSize: '0.72rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {placements.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <div className="empty-state">
                      <div className="empty-icon"><HiOutlineBriefcase /></div>
                      <p className="empty-title">No placements recorded for this criteria</p>
                      <p className="empty-text">
                        {filterBatch
                          ? `No placement offers recorded for Batch ${filterBatch}. Try clearing filters or recording a placement.`
                          : 'Record your first placement by clicking the button above'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : placements.map((p) => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 600, padding: '10px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.studentId ? (
                      <span
                        className="student-name-link"
                        onClick={() => setSelectedStudentForModal(p.studentId)}
                        title={`${p.studentId.name || '-'} (${p.studentId.rollNumber || '-'})`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.studentId.name || '-'}
                        </span>
                        <span className="sd-link-arrow" style={{ flexShrink: 0 }}>↗</span>
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td style={{ padding: '10px 4px', fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.studentId?.rollNumber || '-'}
                  </td>
                  <td style={{ padding: '10px 4px' }}>
                    <span
                      className="badge"
                      style={
                        p.studentId?.batch === currentFinalYearBatch
                          ? { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', fontWeight: 700, padding: '2px 5px', fontSize: '0.67rem', whiteSpace: 'nowrap' }
                          : { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', padding: '2px 5px', fontSize: '0.67rem', whiteSpace: 'nowrap' }
                      }
                    >
                      {p.studentId?.batch || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 4px' }}>
                    <span className="badge badge-info" style={{ padding: '2px 5px', fontSize: '0.67rem', whiteSpace: 'nowrap' }}>
                      {p.studentId?.department || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 6px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }} title={p.companyId?.name || '-'}>
                    {p.companyId?.name || '-'}
                  </td>
                  <td style={{ padding: '10px 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }} title={p.role}>
                    {p.role}
                  </td>
                  <td style={{ padding: '10px 4px', color: 'var(--color-success)', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                    ₹{p.package}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                    <span className="badge badge-neutral" style={{ padding: '2px 5px', fontSize: '0.67rem', whiteSpace: 'nowrap' }}>
                      {p.offerType === 'on_campus' ? 'On Campus' : 'Off Campus'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                    {statusBadge(p.status)}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'center', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    {p.placementDate ? new Date(p.placementDate).toLocaleDateString('en-IN') : '-'}
                  </td>
                  <td style={{ padding: '10px 4px', textAlign: 'center' }}>
                    <div className="row-actions" style={{ justifyContent: 'center', gap: '2px' }}>
                      <button className="btn-icon btn-secondary" style={{ width: '26px', height: '26px', fontSize: '0.72rem', padding: 0 }} onClick={() => setViewPlacement(p)} title="View"><HiOutlineEye /></button>
                      <button className="btn-icon btn-secondary" style={{ width: '26px', height: '26px', fontSize: '0.72rem', padding: 0 }} onClick={() => openEdit(p)} title="Edit"><HiOutlinePencil /></button>
                      <button className="btn-icon btn-danger" style={{ width: '26px', height: '26px', fontSize: '0.72rem', padding: 0 }} onClick={() => setDeleteId(p._id)} title="Delete"><HiOutlineTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Search & Select Student *</span>
                      <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                        Eligible Final Year ({currentFinalYearBatch})
                      </span>
                    </label>
                    <input
                      className="form-input"
                      placeholder={`Type to search final-year (${currentFinalYearBatch}) unplaced students...`}
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{ marginBottom: 8 }}
                    />
                    <select className="form-select" value={form.studentId} onChange={(e) => setForm({...form, studentId: e.target.value})} required size={4} style={{ height: 'auto' }}>
                      <option value="">-- Select Final-Year Student --</option>
                      {allStudents.map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.rollNumber}) - {s.department} [{s.batch}]</option>
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
                <div className="detail-field"><span className="detail-label">Batch</span><span className="detail-value">{viewPlacement.studentId?.batch || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Department</span><span className="detail-value">{viewPlacement.studentId?.department || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Company</span><span className="detail-value">{viewPlacement.companyId?.name || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Role</span><span className="detail-value">{viewPlacement.role}</span></div>
                <div className="detail-field"><span className="detail-label">Package</span><span className="detail-value" style={{ color: 'var(--color-success)', fontWeight: 600 }}>₹{viewPlacement.package} LPA</span></div>
                <div className="detail-field"><span className="detail-label">Offer Type</span><span className="detail-value">{viewPlacement.offerType === 'on_campus' ? 'On Campus' : 'Off Campus'}</span></div>
                <div className="detail-field"><span className="detail-label">Status</span><span className="detail-value">{statusBadge(viewPlacement.status)}</span></div>
                <div className="detail-field"><span className="detail-label">Date</span><span className="detail-value">{new Date(viewPlacement.placementDate).toLocaleDateString('en-IN')}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal title="Delete Placement" message="Deleting this placement will revert the student's status to 'Not Placed' and remove the alumni record." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}

      {selectedStudentForModal && (
        <StudentDetailModal
          student={selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
          onStudentUpdated={fetchPlacements}
          initialTab="offers"
        />
      )}
    </>
  );
};

export default PlacementsPage;
