import { useState, useEffect, useCallback } from 'react';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineUserGroup, HiOutlineUpload, HiOutlineDownload, HiOutlineX } from 'react-icons/hi';
import { getStudents, createStudent, updateStudent, deleteStudent, getBatches, bulkCreateStudents } from '../api/studentApi';
import * as XLSX from 'xlsx';

import ExportButtons from '../components/common/ExportButtons';
import ConfirmModal from '../components/common/ConfirmModal';
import Loader from '../components/common/Loader';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AIDS', 'AIML', 'Other'];

const emptyForm = {
  name: '', rollNumber: '', email: '', phone: '',
  department: 'CSE', batch: '', cgpa: '', skills: '',
};

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const debouncedSearch = useDebounce(search);

  // Bulk Excel Import State
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, search: debouncedSearch };
      if (filterDept) params.department = filterDept;
      if (filterBatch) params.batch = filterBatch;
      if (filterStatus) params.status = filterStatus;
      const res = await getStudents(params);
      setStudents(res.data.students);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterDept, filterBatch, filterStatus]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    getBatches().then(res => setBatches(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (showForm || viewStudent || deleteId || showImport) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showForm, viewStudent, deleteId, showImport]);

  const handleDownloadTemplate = () => {
    try {
      const headers = [
        {
          'Name': 'John Doe',
          'Roll Number': '21CSE001',
          'Email': 'john.doe@email.com',
          'Phone': '9876543210',
          'Department': 'CSE',
          'Batch': '2022-2026',
          'CGPA': '8.5',
          'Skills': 'React, Node.js, JavaScript'
        },
        {
          'Name': 'Jane Smith',
          'Roll Number': '21ECE005',
          'Email': 'jane.smith@email.com',
          'Phone': '9876543211',
          'Department': 'ECE',
          'Batch': '2022-2026',
          'CGPA': '9.2',
          'Skills': 'Python, Machine Learning'
        }
      ];

      const ws = XLSX.utils.json_to_sheet(headers);

      // Auto-fit column widths (EntireColumn.AutoFit)
      const colWidths = Object.keys(headers[0]).map(key => {
        const maxLength = Math.max(
          key.length,
          ...headers.map(row => String(row[key] || '').length)
        );
        return { wch: maxLength + 3 }; // width in characters with padding
      });
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      XLSX.writeFile(wb, 'student_import_template.xlsx');
      toast.success('Template downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate template');
    }
  };


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        if (rawData.length === 0) {
          toast.error('Excel file is empty');
          return;
        }

        const parsedRows = [];
        const validationErrors = [];

        rawData.forEach((row, index) => {
          const rowNum = index + 1;

          const getVal = (possibleKeys) => {
            const foundKey = Object.keys(row).find(
              (k) => possibleKeys.includes(k.trim().toLowerCase())
            );
            return foundKey !== undefined ? row[foundKey] : '';
          };

          const name = String(getVal(['name', 'student name', 'full name']) || '').trim();
          const rollNumber = String(getVal(['roll number', 'rollno', 'roll', 'roll number*']) || '').trim();
          const email = String(getVal(['email', 'email address', 'mail', 'email*']) || '').trim();
          const phone = String(getVal(['phone', 'phone number', 'contact']) || '').trim();
          const department = String(getVal(['department', 'dept', 'department*']) || '').trim().toUpperCase();
          const batch = String(getVal(['batch', 'year', 'batch*']) || '').trim();
          const cgpaVal = getVal(['cgpa', 'gpa']);
          const cgpa = cgpaVal !== '' ? parseFloat(cgpaVal) : 0;
          const skillsRaw = getVal(['skills', 'skill']);
          const skills = typeof skillsRaw === 'string'
            ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
            : Array.isArray(skillsRaw) ? skillsRaw : [];

          const rowErrors = [];
          if (!name) rowErrors.push('Name is required');
          if (!rollNumber) rowErrors.push('Roll Number is required');
          if (!email) {
            rowErrors.push('Email is required');
          } else if (!/\S+@\S+\.\S+/.test(email)) {
            rowErrors.push('Invalid email format');
          }
          if (!department) {
            rowErrors.push('Department is required');
          } else if (!DEPARTMENTS.includes(department)) {
            rowErrors.push(`Dept must be: ${DEPARTMENTS.join(', ')}`);
          }
          if (!batch) rowErrors.push('Batch is required');
          if (cgpaVal !== '' && (isNaN(cgpa) || cgpa < 0 || cgpa > 10)) {
            rowErrors.push('CGPA must be between 0 and 10');
          }

          parsedRows.push({
            name,
            rollNumber,
            email,
            phone,
            department,
            batch,
            cgpa,
            skills,
          });

          if (rowErrors.length > 0) {
            validationErrors.push({ row: rowNum, errors: rowErrors });
          }
        });

        setImportData(parsedRows);
        setImportErrors(validationErrors);
        toast.success(`Successfully parsed ${parsedRows.length} rows`);
      } catch (err) {
        toast.error('Failed to parse Excel file. Please ensure it is a valid format.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    // Only upload rows that are completely valid
    const validRows = importData.filter((_, idx) => !importErrors.some(e => e.row === idx + 1));
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsUploading(true);
    try {
      const res = await bulkCreateStudents(validRows);
      setUploadResults(res.data);
      if (res.data.successCount > 0) {
        toast.success(`Successfully imported ${res.data.successCount} students`);
      }
      if (res.data.skippedCount > 0) {
        toast.warning(`Skipped ${res.data.skippedCount} rows (duplicates or errors)`);
      }
      fetchStudents();
      // Fetch updated batches list
      getBatches().then(res => setBatches(res.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const closeImportModal = () => {
    setShowImport(false);
    setImportFile(null);
    setImportData([]);
    setImportErrors([]);
    setUploadResults(null);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone && form.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    try {
      const data = {
        ...form,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : 0,
        skills: typeof form.skills === 'string' ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : form.skills,
      };
      if (editId) {
        await updateStudent(editId, data);
        toast.success('Student updated');
      } else {
        await createStudent(data);
        toast.success('Student added');
      }
      closeForm();
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteStudent(deleteId);
      toast.success('Student deleted');
      setDeleteId(null);
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const openEdit = (student) => {
    setEditId(student._id);
    setForm({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      phone: student.phone || '',
      department: student.department,
      batch: student.batch,
      cgpa: student.cgpa || '',
      skills: (student.skills || []).join(', '),
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
      if (filterDept) params.department = filterDept;
      if (filterBatch) params.batch = filterBatch;
      if (filterStatus) params.status = filterStatus;
      const res = await getStudents(params);
      return res.data.students;
    } catch {
      toast.error('Failed to fetch full data for export');
      return [];
    }
  };

  const exportColumns = [
    { header: 'Name', accessor: (r) => r.name },
    { header: 'Roll Number', accessor: (r) => r.rollNumber },
    { header: 'Email', accessor: (r) => r.email },
    { header: 'Phone', accessor: (r) => r.phone },
    { header: 'Department', accessor: (r) => r.department },
    { header: 'Batch', accessor: (r) => r.batch },
    { header: 'CGPA', accessor: (r) => r.cgpa },
    { header: 'Status', accessor: (r) => r.status === 'placed' ? 'Placed' : 'Not Placed' },
  ];

  return (
    <>
      <div className="page-header">
        <h2 className="page-header-title">Students</h2>
        <div className="page-header-actions">
          <ExportButtons onExport={handleExportData} columns={exportColumns} filename="students" title="Students Report" />
          <button className="btn btn-secondary" onClick={() => setShowImport(true)} id="import-excel-btn">
            <HiOutlineUpload /> Import Excel
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)} id="add-student-btn">
            <HiOutlinePlus /> Add Student
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="table-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <HiOutlineSearch className="search-icon" />
            <input
              placeholder="Search students..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              id="search-students"
            />
          </div>
          <select className="filter-select" value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select className="filter-select" value={filterBatch} onChange={(e) => { setFilterBatch(e.target.value); setPage(1); }}>
            <option value="">All Batches</option>
            {batches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="placed">Placed</option>
            <option value="not_placed">Not Placed</option>
          </select>
          {(search || filterDept || filterBatch || filterStatus) && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                setSearch('');
                setFilterDept('');
                setFilterBatch('');
                setFilterStatus('');
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

      {/* Table */}
      {loading ? <Loader /> : (
        <div className="data-table-wrapper">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Roll No</th>
                  <th>Department</th>
                  <th>Batch</th>
                  <th>CGPA</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-icon"><HiOutlineUserGroup /></div>
                        <p className="empty-title">No students found</p>
                        <p className="empty-text">Add your first student to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : students.map((s) => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</td>
                    <td>{s.rollNumber}</td>
                    <td><span className="badge badge-info">{s.department}</span></td>
                    <td>{s.batch}</td>
                    <td>{s.cgpa}</td>
                    <td>
                      <span className={`badge ${s.status === 'placed' ? 'badge-success' : 'badge-warning'}`}>
                        {s.status === 'placed' ? 'Placed' : 'Not Placed'}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon btn-secondary" onClick={() => setViewStudent(s)} title="View">
                          <HiOutlineEye />
                        </button>
                        <button className="btn-icon btn-secondary" onClick={() => openEdit(s)} title="Edit">
                          <HiOutlinePencil />
                        </button>
                        <button className="btn-icon btn-danger" onClick={() => setDeleteId(s._id)} title="Delete">
                          <HiOutlineTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">Showing {students.length} of {total} students</span>
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

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="form-overlay" onClick={closeForm}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">{editId ? 'Edit Student' : 'Add New Student'}</h3>
              <button className="form-close" onClick={closeForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Roll Number *</label>
                    <input className="form-input" value={form.rollNumber} onChange={(e) => setForm({...form, rollNumber: e.target.value})} required placeholder="21CSE001" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required placeholder="john@email.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
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
                    <label className="form-label">Department *</label>
                    <select className="form-select" value={form.department} onChange={(e) => setForm({...form, department: e.target.value})}>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch *</label>
                    <input className="form-input" value={form.batch} onChange={(e) => setForm({...form, batch: e.target.value})} required placeholder="2022-2026" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">CGPA</label>
                    <input className="form-input" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={(e) => setForm({...form, cgpa: e.target.value})} placeholder="8.5" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Skills (comma separated)</label>
                    <input className="form-input" value={form.skills} onChange={(e) => setForm({...form, skills: e.target.value})} placeholder="React, Node.js, Python" />
                  </div>
                </div>
              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewStudent && (
        <div className="form-overlay" onClick={() => setViewStudent(null)}>
          <div className="form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">Student Details</h3>
              <button className="form-close" onClick={() => setViewStudent(null)}>×</button>
            </div>
            <div className="form-body">
              <div className="detail-grid">
                <div className="detail-field"><span className="detail-label">Name</span><span className="detail-value">{viewStudent.name}</span></div>
                <div className="detail-field"><span className="detail-label">Roll Number</span><span className="detail-value">{viewStudent.rollNumber}</span></div>
                <div className="detail-field">
                  <span className="detail-label">Email</span>
                  <span className="detail-value">
                    {viewStudent.email ? (
                      <a 
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${viewStudent.email}`} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ textDecoration: 'underline' }}
                      >
                        {viewStudent.email}
                      </a>
                    ) : '-'}
                  </span>
                </div>
                <div className="detail-field"><span className="detail-label">Phone</span><span className="detail-value">{viewStudent.phone || '-'}</span></div>
                <div className="detail-field"><span className="detail-label">Department</span><span className="detail-value">{viewStudent.department}</span></div>
                <div className="detail-field"><span className="detail-label">Batch</span><span className="detail-value">{viewStudent.batch}</span></div>
                <div className="detail-field"><span className="detail-label">CGPA</span><span className="detail-value">{viewStudent.cgpa}</span></div>
                <div className="detail-field">
                  <span className="detail-label">Status</span>
                  <span className={`badge ${viewStudent.status === 'placed' ? 'badge-success' : 'badge-warning'}`}>
                    {viewStudent.status === 'placed' ? 'Placed' : 'Not Placed'}
                  </span>
                </div>
                <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Skills</span>
                  <span className="detail-value">
                    {(viewStudent.skills || []).length > 0
                      ? viewStudent.skills.map((s, i) => <span key={i} className="badge badge-neutral" style={{ marginRight: 6, marginBottom: 4 }}>{s}</span>)
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <ConfirmModal
          title="Delete Student"
          message="Are you sure you want to delete this student? All related records may be affected."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Excel Import Modal */}
      {showImport && (
        <div className="form-overlay" onClick={closeImportModal}>
          <div className="form-modal import-modal-width" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3 className="form-title">Bulk Import Students</h3>
              <button className="form-close" onClick={closeImportModal}>×</button>
            </div>
            
            <div className="form-body">
              {!uploadResults ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Download the template, fill student details, and upload it back.
                    </p>
                    <button className="template-btn" onClick={handleDownloadTemplate}>
                      <HiOutlineDownload /> Download Template
                    </button>
                  </div>

                  {!importFile ? (
                    <label className="upload-zone">
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                      />
                      <HiOutlineUpload className="upload-zone-icon" />
                      <span className="upload-zone-text" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        Click to upload or drag & drop Excel file
                      </span>
                      <span className="upload-zone-text" style={{ fontSize: '0.75rem' }}>
                        Supports .xlsx, .xls format
                      </span>
                    </label>
                  ) : (
                    <div className="file-info">
                      <div className="file-info-left">
                        <span style={{ color: 'var(--accent-start)' }}>📊</span>
                        <span>{importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <span className="file-info-remove" onClick={() => { setImportFile(null); setImportData([]); setImportErrors([]); }}>
                        ×
                      </span>
                    </div>
                  )}

                  {importData.length > 0 && (
                    <div className="preview-section">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          File Preview ({importData.length} Rows Parsed)
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Valid: {importData.length - importErrors.length} | Errors: {importErrors.length}
                        </span>
                      </div>

                      <div className="preview-table-container">
                        <div className="preview-table-scroll">
                          <table className="preview-table">
                            <thead>
                              <tr>
                                <th>Row</th>
                                <th>Name</th>
                                <th>Roll Number</th>
                                <th>Email</th>
                                <th>Dept</th>
                                <th>Batch</th>
                                <th>CGPA</th>
                                <th>Skills</th>
                                <th>Validation / Errors</th>
                              </tr>
                            </thead>
                            <tbody>
                              {importData.map((row, idx) => {
                                const rowNum = idx + 1;
                                const rowErr = importErrors.find(e => e.row === rowNum);
                                return (
                                  <tr key={idx} className={rowErr ? 'preview-row-invalid' : ''}>
                                    <td>{rowNum}</td>
                                    <td style={rowErr && !row.name ? { color: 'var(--color-error)' } : {}}>{row.name || 'MISSING'}</td>
                                    <td style={rowErr && !row.rollNumber ? { color: 'var(--color-error)' } : {}}>{row.rollNumber || 'MISSING'}</td>
                                    <td style={rowErr && (!row.email || rowErr.errors.some(e => e.includes('Email'))) ? { color: 'var(--color-error)' } : {}}>{row.email || 'MISSING'}</td>
                                    <td style={rowErr && (!row.department || rowErr.errors.some(e => e.includes('Dept'))) ? { color: 'var(--color-error)' } : {}}>
                                      <span className={row.department && DEPARTMENTS.includes(row.department) ? 'badge badge-info' : 'badge badge-danger'}>
                                        {row.department || 'MISSING'}
                                      </span>
                                    </td>
                                    <td style={rowErr && !row.batch ? { color: 'var(--color-error)' } : {}}>{row.batch || 'MISSING'}</td>
                                    <td>{row.cgpa}</td>
                                    <td>{row.skills.join(', ')}</td>
                                    <td>
                                      {rowErr ? (
                                        <ul className="error-list">
                                          {rowErr.errors.map((e, i) => <li key={i}>{e}</li>)}
                                        </ul>
                                      ) : (
                                        <span style={{ color: 'var(--color-success)', fontWeight: 500 }}>✓ Valid</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {importErrors.length > 0 && (
                        <div style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          color: 'var(--color-error)',
                          marginTop: '12px'
                        }}>
                          ⚠ Warning: File contains invalid rows (marked in red). These rows will be automatically skipped during import. Please verify before proceeding.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="results-card">
                  <h4 className="results-card-title">Bulk Import Finished!</h4>
                  <div className="results-stats">
                    <div className="results-stat-item results-stat-success">
                      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{uploadResults.successCount}</div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Imported Successfully</div>
                    </div>
                    <div className="results-stat-item results-stat-skipped">
                      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{uploadResults.skippedCount}</div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skipped (Errors/Exist)</div>
                    </div>
                  </div>

                  {(uploadResults.skipped.length > 0 || uploadResults.errors.length > 0) && (
                    <div style={{ marginTop: '10px' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        Skipped Records Details:
                      </p>
                      <div className="skipped-items-list">
                        {uploadResults.skipped.map((s, idx) => (
                          <div key={`s-${idx}`} className="skipped-item">
                            Row {s.row} ({s.student.name || 'No Name'}): {s.reason}
                          </div>
                        ))}
                        {uploadResults.errors.map((e, idx) => (
                          <div key={`e-${idx}`} className="skipped-item" style={{ borderLeftColor: 'var(--color-error)' }}>
                            Row {e.row} ({e.student.name || 'No Name'}): {e.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-footer">
              {!uploadResults ? (
                <>
                  <button type="button" className="btn btn-secondary" onClick={closeImportModal}>
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    disabled={isUploading || importData.length === 0 || (importData.length - importErrors.length) === 0} 
                    onClick={handleBulkSubmit}
                  >
                    {isUploading ? 'Importing...' : `Import ${importData.length - importErrors.length} Valid Students`}
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-primary" onClick={closeImportModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};


export default StudentsPage;
