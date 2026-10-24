import { useState, useEffect, useCallback } from 'react';
import {
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineX,
  HiOutlineOfficeBuilding,
  HiOutlineEye,
  HiOutlinePencil,
  HiOutlineTrash,
} from 'react-icons/hi';
import { getCompanies, getAllCompanies, createCompany, updateCompany, deleteCompany } from '../api/companyApi';
import { createDrive } from '../api/driveApi';
import ExportButtons from '../components/common/ExportButtons';
import ConfirmModal from '../components/common/ConfirmModal';
import CompanyDetailModal from '../components/common/CompanyDetailModal';
import Loader from '../components/common/Loader';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '', industry: '', website: '', location: '', visits: 1,
  contactPerson: '', contactRole: 'Campus Hiring Lead / HR Manager',
  contactEmail: '', contactPhone: '', description: '',
};

const emptyDriveDetails = {
  role: '',
  package: '',
  driveDate: '',
  minCgpa: '6.5',
  jobLocation: 'Pan India / Hybrid',
};

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedExistingId, setSelectedExistingId] = useState('');
  const [createSeparateDrive, setCreateSeparateDrive] = useState(true);
  const [driveDetails, setDriveDetails] = useState(emptyDriveDetails);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [viewCompany, setViewCompany] = useState(null);
  const debouncedSearch = useDebounce(search);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, search: debouncedSearch };
      if (filterIndustry) params.industry = filterIndustry;
      const res = await getCompanies(params);
      setCompanies(res.data.companies);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch {
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterIndustry]);

  const fetchAllCompanies = useCallback(async () => {
    try {
      const res = await getAllCompanies();
      const list = Array.isArray(res.data) ? res.data : (res.data.companies || []);
      setAllCompanies(list);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
    fetchAllCompanies();
  }, [fetchCompanies, fetchAllCompanies]);

  useEffect(() => {
    if (showForm || viewCompany || deleteId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm, viewCompany, deleteId]);

  // When selecting an existing available company, auto-increment to 2nd (or next) visit!
  const handleSelectExistingCompany = (compId) => {
    setSelectedExistingId(compId);
    if (!compId) {
      setForm(emptyForm);
      setDriveDetails(emptyDriveDetails);
      return;
    }

    const comp = allCompanies.find((c) => c._id === compId);
    if (!comp) return;

    const currentVisits = comp.visits || 1;
    const nextVisit = currentVisits + 1; // AUTOMATICALLY SET TO 2nd (OR NEXT) VISIT!

    setForm({
      name: comp.name || '',
      industry: comp.industry || '',
      website: comp.website || '',
      location: comp.location || 'Chennai / Bangalore / Pan India',
      visits: nextVisit, // Auto-incremented
      contactPerson: comp.contactPerson || '',
      contactRole: comp.contactRole || 'Campus Hiring Lead / HR Manager',
      contactEmail: comp.contactEmail || '',
      contactPhone: comp.contactPhone || '',
      description: comp.description || '',
    });

    setDriveDetails({
      role: `Software Engineer (Visit ${nextVisit})`,
      package: '',
      driveDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      minCgpa: '6.5',
      jobLocation: comp.location || 'Pan India / Hybrid',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateCompany(editId, form);
        toast.success('Company updated successfully');
      } else if (selectedExistingId) {
        // Recording 2nd / Return Visit for an available company!
        await updateCompany(selectedExistingId, form);

        // Also create a separate placement drive for this visit if requested
        if (createSeparateDrive && driveDetails.role) {
          await createDrive({
            companyId: selectedExistingId,
            companyName: form.name,
            visitNumber: form.visits,
            role: driveDetails.role,
            package: Number(driveDetails.package) || 0,
            driveDate: driveDetails.driveDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            minCgpa: Number(driveDetails.minCgpa) || 6.0,
            jobLocation: driveDetails.jobLocation || form.location || 'Pan India / Hybrid',
            title: `${form.name} Campus Recruitment Drive (Visit ${form.visits})`,
          });
          toast.success(`Recorded Visit ${form.visits} for ${form.name} and scheduled separate placement drive!`);
        } else {
          toast.success(`Recorded Visit ${form.visits} for ${form.name}!`);
        }
      } else {
        // Adding a brand new company partner
        const newCompRes = await createCompany(form);
        const newComp = newCompRes.data;

        if (createSeparateDrive && driveDetails.role && newComp?._id) {
          await createDrive({
            companyId: newComp._id,
            companyName: form.name,
            visitNumber: form.visits || 1,
            role: driveDetails.role,
            package: Number(driveDetails.package) || 0,
            driveDate: driveDetails.driveDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            minCgpa: Number(driveDetails.minCgpa) || 6.0,
            jobLocation: driveDetails.jobLocation || form.location || 'Pan India / Hybrid',
            title: `${form.name} Campus Recruitment Drive (Visit ${form.visits || 1})`,
          });
          toast.success(`Added ${form.name} with separate Visit 1 placement drive!`);
        } else {
          toast.success('Company added');
        }
      }
      closeForm();
      fetchCompanies();
      fetchAllCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCompany(deleteId);
      toast.success('Company deleted');
      setDeleteId(null);
      fetchCompanies();
      fetchAllCompanies();
    } catch {
      toast.error('Failed to delete company');
    }
  };

  const openEdit = (company) => {
    setEditId(company._id);
    setSelectedExistingId('');
    setForm({
      name: company.name,
      industry: company.industry,
      website: company.website || '',
      location: company.location || '',
      visits: company.visits ?? 1,
      contactPerson: company.contactPerson || '',
      contactRole: company.contactRole || 'Campus Hiring Lead / HR Manager',
      contactEmail: company.contactEmail || '',
      contactPhone: company.contactPhone || '',
      description: company.description || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setSelectedExistingId('');
    setCreateSeparateDrive(true);
    setDriveDetails(emptyDriveDetails);
    setForm(emptyForm);
  };

  const handleExportData = async () => {
    try {
      const params = { page: 1, limit: 1000000, search: debouncedSearch };
      if (filterIndustry) params.industry = filterIndustry;
      const res = await getCompanies(params);
      return res.data.companies;
    } catch {
      toast.error('Failed to fetch full data for export');
      return [];
    }
  };

  const exportColumns = [
    { header: 'Name', accessor: (r) => r.name },
    { header: 'Industry', accessor: (r) => r.industry },
    { header: 'Contact Person', accessor: (r) => r.contactPerson },
    { header: 'Contact Email', accessor: (r) => r.contactEmail },
    { header: 'Contact Phone', accessor: (r) => r.contactPhone },
    { header: 'No. of Visits', accessor: (r) => r.visits || 1 },
    { header: 'Students Placed', accessor: (r) => r.studentsPlaced || 0 },
    { header: 'Website', accessor: (r) => r.website },
  ];

  const INDUSTRIES = ['IT', 'Finance', 'Consulting', 'Manufacturing', 'Healthcare', 'E-commerce', 'Education', 'Telecom', 'Automotive', 'Other'];

  return (
    <>
      <div className="page-header">
        <h2 className="page-header-title">Companies</h2>
        <div className="page-header-actions">
          <ExportButtons onExport={handleExportData} columns={exportColumns} filename="companies" title="Companies Report" />
          <button className="btn btn-primary" onClick={() => setShowForm(true)} id="add-company-btn">
            <HiOutlinePlus /> Add Company
          </button>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input placeholder="Search companies..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} id="search-companies" />
          </div>
          <select className="filter-select" value={filterIndustry} onChange={(e) => { setFilterIndustry(e.target.value); setPage(1); }}>
            <option value="">All Industries</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          {(search || filterIndustry) && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                setSearch('');
                setFilterIndustry('');
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
                  <th>Company Name</th>
                  <th>Industry</th>
                  <th>Contact Person</th>
                  <th>Contact Email</th>
                  <th style={{ textAlign: 'center' }}>No. of Visits</th>
                  <th style={{ textAlign: 'center' }}>Students Placed</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-icon"><HiOutlineOfficeBuilding /></div>
                        <p className="empty-title">No companies found</p>
                        <p className="empty-text">Add your first company partner</p>
                      </div>
                    </td>
                  </tr>
                ) : companies.map((c) => (
                  <tr key={c._id}>
                    <td
                      style={{ fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setViewCompany(c)}
                      title="Click to view company details, HR contacts, placed & attended students"
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
                        {c.name}
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>↗</span>
                      </span>
                    </td>
                    <td><span className="badge badge-info">{c.industry}</span></td>
                    <td>{c.contactPerson || '-'}</td>
                    <td>{c.contactEmail || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        className="badge badge-neutral"
                        style={{
                          fontWeight: 700,
                          padding: '3px 10px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {c.visits || 1}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="badge badge-success" style={{ fontWeight: 700 }}>
                        {c.studentsPlaced || 0}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="row-actions" style={{ justifyContent: 'center' }}>
                        <button className="btn-icon btn-secondary" onClick={() => setViewCompany(c)} title="View"><HiOutlineEye /></button>
                        <button className="btn-icon btn-secondary" onClick={() => openEdit(c)} title="Edit"><HiOutlinePencil /></button>
                        <button className="btn-icon btn-danger" onClick={() => setDeleteId(c._id)} title="Delete"><HiOutlineTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">Showing {companies.length} of {total} companies</span>
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
          <div
            className="form-modal"
            style={{ maxWidth: '820px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="form-header">
              <h3 className="form-title">
                {editId
                  ? 'Edit Company Details'
                  : selectedExistingId
                  ? `Record Campus Visit ${form.visits} for ${form.name}`
                  : 'Add New Company / Record Campus Visit'}
              </h3>
              <button className="form-close" onClick={closeForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="form-body" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
                
                {/* Available Company Selector (only in create mode) */}
                {!editId && (
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                      Select Available Company to Record Next Visit (e.g. 2nd Visit):
                    </label>
                    <select
                      className="form-select"
                      value={selectedExistingId}
                      onChange={(e) => handleSelectExistingCompany(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #94a3b8', fontSize: '0.88rem', background: '#ffffff' }}
                    >
                      <option value="">Enter Brand New Company Partner Below (Defaults to Visit 1)</option>
                      {allCompanies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} — (Currently {c.visits || 1} {c.visits === 1 ? 'Visit' : 'Visits'} recorded)
                        </option>
                      ))}
                    </select>

                    {selectedExistingId && (
                      <div style={{ marginTop: '10px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#065f46' }}>
                            Auto-Configured for {form.visits === 2 ? '2nd' : form.visits === 3 ? '3rd' : `${form.visits}th`} Campus Visit!
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                            Previous visits: <strong>{allCompanies.find(c => c._id === selectedExistingId)?.visits || 1}</strong>. Automatically set to <strong>Visit {form.visits}</strong> with existing company details filled in.
                          </div>
                        </div>
                        <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.82rem', padding: '4px 10px', flexShrink: 0 }}>
                          Visit {form.visits}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Company Details Form Fields */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      placeholder="e.g. Google / Goldman Sachs"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry *</label>
                    <select
                      className="form-select"
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      required
                    >
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Website</label>
                    <input
                      className="form-input"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      placeholder="https://www.company.com/careers"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Office / Campus Location</label>
                    <input
                      className="form-input"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Chennai / Bangalore / Pan India"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Primary Contact Person</label>
                    <input
                      className="form-input"
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      placeholder="e.g. Radhika Singhal"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation / Role</label>
                    <input
                      className="form-input"
                      value={form.contactRole}
                      onChange={(e) => setForm({ ...form, contactRole: e.target.value })}
                      placeholder="e.g. Campus Hiring Lead / HR Manager"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input
                      className="form-input"
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                      placeholder="hr@company.com"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      className="form-input"
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description about the company, hiring criteria, etc..."
                  />
                </div>

                {/* Separate Placement Drive Scheduling Section */}
                {!editId && (
                  <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: createSeparateDrive ? '12px' : '0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', cursor: 'pointer', margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={createSeparateDrive}
                          onChange={(e) => setCreateSeparateDrive(e.target.checked)}
                          style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                        />
                        <span>Schedule Separate Placement Drive for Visit {form.visits}</span>
                      </label>
                      <span className="badge badge-info" style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                        Separate Drive (Visit {form.visits})
                      </span>
                    </div>

                    {createSeparateDrive && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                          Each visit's drive is tracked separately with its own registered students, rounds, and placed offers.
                        </p>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Job Role for Visit {form.visits} *</label>
                            <input
                              className="form-input"
                              value={driveDetails.role}
                              onChange={(e) => setDriveDetails({ ...driveDetails, role: e.target.value })}
                              required={createSeparateDrive}
                              placeholder={`e.g. Software Engineer (Visit ${form.visits})`}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Package (₹ LPA) *</label>
                            <input
                              className="form-input"
                              type="number"
                              step="0.1"
                              min="0"
                              value={driveDetails.package}
                              onChange={(e) => setDriveDetails({ ...driveDetails, package: e.target.value })}
                              required={createSeparateDrive}
                              placeholder="e.g. 14.5"
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">Drive Date *</label>
                            <input
                              className="form-input"
                              type="date"
                              value={driveDetails.driveDate}
                              onChange={(e) => setDriveDetails({ ...driveDetails, driveDate: e.target.value })}
                              required={createSeparateDrive}
                            />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Min CGPA</label>
                            <input
                              className="form-input"
                              type="number"
                              step="0.1"
                              min="0"
                              max="10"
                              value={driveDetails.minCgpa}
                              onChange={(e) => setDriveDetails({ ...driveDetails, minCgpa: e.target.value })}
                              placeholder="6.5"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editId
                    ? 'Update Company'
                    : selectedExistingId
                    ? `Record Visit ${form.visits}`
                    : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Company Detail Modal */}
      {viewCompany && (
        <CompanyDetailModal
          company={viewCompany}
          onClose={() => setViewCompany(null)}
          onCompanyUpdated={fetchCompanies}
        />
      )}

      {deleteId && (
        <ConfirmModal title="Delete Company" message="Are you sure you want to delete this company?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </>
  );
};

export default CompaniesPage;
