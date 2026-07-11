import { useState, useEffect, useCallback } from 'react';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineOfficeBuilding, HiOutlineX } from 'react-icons/hi';
import { getCompanies, createCompany, updateCompany, deleteCompany } from '../api/companyApi';
import ExportButtons from '../components/common/ExportButtons';
import ConfirmModal from '../components/common/ConfirmModal';
import Loader from '../components/common/Loader';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const emptyForm = {
  name: '', industry: '', website: '', contactPerson: '',
  contactEmail: '', contactPhone: '', description: '',
};

const CompaniesPage = () => {
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
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

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateCompany(editId, form);
        toast.success('Company updated');
      } else {
        await createCompany(form);
        toast.success('Company added');
      }
      closeForm();
      fetchCompanies();
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
    } catch {
      toast.error('Failed to delete company');
    }
  };

  const openEdit = (company) => {
    setEditId(company._id);
    setForm({
      name: company.name,
      industry: company.industry,
      website: company.website || '',
      contactPerson: company.contactPerson || '',
      contactEmail: company.contactEmail || '',
      contactPhone: company.contactPhone || '',
      description: company.description || '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
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
    { header: 'Students Placed', accessor: (r) => r.studentsPlaced },
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
                  <th>Students Placed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-icon"><HiOutlineOfficeBuilding /></div>
                        <p className="empty-title">No companies found</p>
                        <p className="empty-text">Add your first company partner</p>
                      </div>
                    </td>
                  </tr>
                ) : companies.map((c) => (
                  <tr key={c._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</td>
                    <td><span className="badge badge-info">{c.industry}</span></td>
                    <td>{c.contactPerson || '-'}</td>
                    <td>{c.contactEmail || '-'}</td>
                    <td><span className="badge badge-success">{c.studentsPlaced || 0}</span></td>
                    <td>
                      <div className="row-actions">
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
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">{editId ? 'Edit Company' : 'Add New Company'}</h3>
              <button className="form-close" onClick={closeForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="TCS" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry *</label>
                    <select className="form-select" value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})} required>
                      <option value="">Select Industry</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Website</label>
                  <input className="form-input" value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} placeholder="https://www.company.com" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Person</label>
                    <input className="form-input" value={form.contactPerson} onChange={(e) => setForm({...form, contactPerson: e.target.value})} placeholder="HR Manager" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Email</label>
                    <input className="form-input" type="email" value={form.contactEmail} onChange={(e) => setForm({...form, contactEmail: e.target.value})} placeholder="hr@company.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input className="form-input" value={form.contactPhone} onChange={(e) => setForm({...form, contactPhone: e.target.value})} placeholder="9876543210" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Brief description about the company..." />
                </div>
              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add Company'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail */}
      {viewCompany && (
        <div className="form-overlay" onClick={() => setViewCompany(null)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">Company Details</h3>
              <button className="form-close" onClick={() => setViewCompany(null)}>×</button>
            </div>
            <div className="form-body">
              <div className="detail-grid">
                <div className="detail-field"><span className="detail-label">Name</span><span className="detail-value">{viewCompany.name}</span></div>
                <div className="detail-field"><span className="detail-label">Industry</span><span className="detail-value">{viewCompany.industry}</span></div>
                <div className="detail-field"><span className="detail-label">Contact Person</span><span className="detail-value">{viewCompany.contactPerson || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Contact Email</span><span className="detail-value">{viewCompany.contactEmail || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Contact Phone</span><span className="detail-value">{viewCompany.contactPhone || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Students Placed</span><span className="badge badge-success">{viewCompany.studentsPlaced || 0}</span></div>
                <div className="detail-field"><span className="detail-label">Website</span><span className="detail-value">{viewCompany.website ? <a href={viewCompany.website} target="_blank" rel="noreferrer">{viewCompany.website}</a> : '-'}</span></div>
                <div className="detail-field" style={{ gridColumn: '1 / -1' }}><span className="detail-label">Description</span><span className="detail-value">{viewCompany.description || '-'}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <ConfirmModal title="Delete Company" message="Are you sure you want to delete this company?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </>
  );
};

export default CompaniesPage;
