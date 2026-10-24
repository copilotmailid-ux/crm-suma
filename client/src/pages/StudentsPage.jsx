import { useState, useEffect, useCallback } from 'react';
import { HiOutlineSearch, HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineUserGroup, HiOutlineUpload, HiOutlineDownload, HiOutlineX } from 'react-icons/hi';
import { getStudents, createStudent, updateStudent, deleteStudent, getBatches, bulkCreateStudents, getStudentDrives } from '../api/studentApi';
import { getAllCompanies } from '../api/companyApi';
import * as XLSX from 'xlsx';

import ExportButtons from '../components/common/ExportButtons';
import ConfirmModal from '../components/common/ConfirmModal';
import Loader from '../components/common/Loader';
import StudentDetailModal from '../components/common/StudentDetailModal';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AIDS', 'AIML', 'Other'];
const CAREER_PREFERENCES = ['Placement', 'Entrepreneurship', 'Higher Studies', 'Government Job', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];

const DRIVE_TYPES = [
  { value: 'on_campus', label: '🏫 On-Campus Drive' },
  { value: 'external_off_campus', label: '🌐 External Drive' },
];

const emptyForm = {
  name: '', rollNumber: '', email: '', phone: '',
  gender: '', dob: '',
  department: 'CSE', batch: '', cgpa: '',
  tenthPercentage: '', twelfthPercentage: '',
  currentArrears: 0, historyOfArrears: 0,
  careerPreference: 'Placement', careerDetails: '',
  status: 'not_placed',
  skills: '', resumeUrl: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '', address: '',
  // Placement & Drive details (when status === 'placed')
  placedCompany: '',
  placedCompanyId: '',
  placedDriveType: 'on_campus',
  placedDriveDetails: '',
  placedRole: '',
  placedPackage: '',
  placedDate: new Date().toISOString().split('T')[0],
  placedOfferLetterUrl: '',
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
  const [filterCareer, setFilterCareer] = useState('');
  const [batches, setBatches] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
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
      if (filterCareer) params.careerPreference = filterCareer;
      const res = await getStudents(params);
      setStudents(res.data.students);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterDept, filterBatch, filterStatus, filterCareer]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  useEffect(() => {
    getBatches().then(res => setBatches(res.data)).catch(() => {});
    getAllCompanies().then(res => setCompaniesList(res.data || [])).catch(() => {});
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
    const isPlaced = form.careerPreference === 'Placement' && form.status === 'placed';
    if (isPlaced) {
      if (!form.placedCompany || !form.placedCompany.trim()) {
        toast.error('Please enter or select the recruiting company name');
        return;
      }
      if (!form.placedRole || !form.placedRole.trim()) {
        toast.error('Please enter the job role offered');
        return;
      }
      if (form.placedPackage === '' || isNaN(form.placedPackage) || Number(form.placedPackage) < 0) {
        toast.error('Please enter a valid salary package (LPA)');
        return;
      }
    }
    try {
      const data = {
        ...form,
        status: isPlaced ? 'placed' : 'not_placed',
        cgpa: form.cgpa !== '' ? parseFloat(form.cgpa) : 0,
        tenthPercentage: form.tenthPercentage !== '' ? parseFloat(form.tenthPercentage) : 0,
        twelfthPercentage: form.twelfthPercentage !== '' ? parseFloat(form.twelfthPercentage) : 0,
        currentArrears: form.currentArrears !== '' ? parseInt(form.currentArrears, 10) : 0,
        historyOfArrears: form.historyOfArrears !== '' ? parseInt(form.historyOfArrears, 10) : 0,
        skills: typeof form.skills === 'string' ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : form.skills,
        // Placement synchronization fields (only applied if career preference is Placement and placed)
        companyName: isPlaced ? form.placedCompany : '',
        companyId: isPlaced ? form.placedCompanyId : null,
        placedCompany: isPlaced ? form.placedCompany : '',
        placedCompanyId: isPlaced ? form.placedCompanyId : null,
        placedRole: isPlaced ? form.placedRole : '',
        role: isPlaced ? form.placedRole : '',
        placedPackage: isPlaced && form.placedPackage !== '' ? parseFloat(form.placedPackage) : 0,
        package: isPlaced && form.placedPackage !== '' ? parseFloat(form.placedPackage) : 0,
        driveType: isPlaced ? form.placedDriveType : 'on_campus',
        placedDriveType: isPlaced ? form.placedDriveType : 'on_campus',
        driveDetails: isPlaced && form.placedDriveType === 'on_campus' ? form.placedDriveDetails : '',
        placedDriveDetails: isPlaced && form.placedDriveType === 'on_campus' ? form.placedDriveDetails : '',
        placementDate: isPlaced ? form.placedDate : null,
        placedDate: isPlaced ? form.placedDate : null,
        offerLetterUrl: isPlaced ? form.placedOfferLetterUrl : '',
      };
      if (editId) {
        await updateStudent(editId, data);
        toast.success('Student profile and placement details updated');
      } else {
        await createStudent(data);
        toast.success('Student added successfully');
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
    const p = student.placementId || {};
    const compName = p.companyId?.name || (typeof p.companyId === 'string' ? p.companyId : '');
    const compId = p.companyId?._id || (typeof p.companyId === 'string' ? p.companyId : '');

    setForm({
      name: student.name || '',
      rollNumber: student.rollNumber || '',
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender || '',
      dob: student.dob || '',
      department: student.department || 'CSE',
      batch: student.batch || '',
      cgpa: student.cgpa !== undefined && student.cgpa !== null ? student.cgpa : '',
      tenthPercentage: student.tenthPercentage !== undefined && student.tenthPercentage !== null ? student.tenthPercentage : '',
      twelfthPercentage: student.twelfthPercentage !== undefined && student.twelfthPercentage !== null ? student.twelfthPercentage : '',
      currentArrears: student.currentArrears ?? 0,
      historyOfArrears: student.historyOfArrears ?? 0,
      careerPreference: student.careerPreference || 'Placement',
      careerDetails: student.careerDetails || '',
      status: student.status || (student.placementId ? 'placed' : 'not_placed'),
      skills: (student.skills || []).join(', '),
      resumeUrl: student.resumeUrl || '',
      linkedinUrl: student.linkedinUrl || '',
      githubUrl: student.githubUrl || '',
      portfolioUrl: student.portfolioUrl || '',
      address: student.address || '',
      // Placed details
      placedCompany: compName || '',
      placedCompanyId: compId || '',
      placedDriveType: p.driveType || (p.offerType === 'off_campus' ? 'external_off_campus' : 'on_campus'),
      placedDriveDetails: p.driveDetails || '',
      placedRole: p.role || '',
      placedPackage: p.package !== undefined && p.package !== null ? p.package : '',
      placedDate: p.placementDate ? new Date(p.placementDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      placedOfferLetterUrl: p.offerLetterUrl || student.offerLetterUrl || '',
    });
    setShowForm(true);

    // If student is placed and placementId details were sparse, backfill from student drives API
    if (student.status === 'placed' && (!compName || !p.role)) {
      getStudentDrives(student._id).then(res => {
        const placements = res.data?.placements || [];
        const drives = res.data?.drives || [];
        const placedDrive = drives.find(d => d.isPlaced);
        if (placements.length > 0) {
          const primaryP = placements[0];
          setForm(prev => ({
            ...prev,
            placedCompany: prev.placedCompany || primaryP.companyId?.name || (typeof primaryP.companyId === 'string' ? primaryP.companyId : ''),
            placedCompanyId: prev.placedCompanyId || primaryP.companyId?._id || '',
            placedDriveType: prev.placedDriveType || primaryP.driveType || (primaryP.offerType === 'off_campus' ? 'external_off_campus' : 'on_campus'),
            placedDriveDetails: prev.placedDriveDetails || primaryP.driveDetails || '',
            placedRole: prev.placedRole || primaryP.role || '',
            placedPackage: prev.placedPackage !== '' ? prev.placedPackage : (primaryP.package || ''),
            placedDate: primaryP.placementDate ? new Date(primaryP.placementDate).toISOString().split('T')[0] : prev.placedDate,
            placedOfferLetterUrl: prev.placedOfferLetterUrl || primaryP.offerLetterUrl || '',
          }));
        } else if (placedDrive) {
          setForm(prev => ({
            ...prev,
            placedCompany: prev.placedCompany || placedDrive.companyName || placedDrive.company?.name || '',
            placedDriveType: prev.placedDriveType || 'on_campus',
            placedDriveDetails: prev.placedDriveDetails || placedDrive.title || '',
            placedRole: prev.placedRole || placedDrive.role || '',
            placedPackage: prev.placedPackage !== '' ? prev.placedPackage : (placedDrive.package || ''),
          }));
        }
      }).catch(() => {});
    }
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
      if (filterCareer) params.careerPreference = filterCareer;
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
    { header: 'Career Goal', accessor: (r) => r.careerPreference || 'Placement' },
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
          <select className="filter-select" value={filterCareer} onChange={(e) => { setFilterCareer(e.target.value); setPage(1); }}>
            <option value="">All Career Paths</option>
            <option value="Placement">💼 Placement</option>
            <option value="Entrepreneurship">🚀 Entrepreneurship</option>
            <option value="Higher Studies">🎓 Higher Studies (PG)</option>
            <option value="Government Job">🏛️ Government Job</option>
            <option value="Other">🌐 Other</option>
          </select>
          {(search || filterDept || filterBatch || filterStatus || filterCareer) && (
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                setSearch('');
                setFilterDept('');
                setFilterBatch('');
                setFilterStatus('');
                setFilterCareer('');
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
                  <th>Career Goal</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-icon"><HiOutlineUserGroup /></div>
                        <p className="empty-title">No students found</p>
                        <p className="empty-text">Add your first student to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : students.map((s) => (
                  <tr key={s._id}>
                    <td
                      style={{ fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => setViewStudent(s)}
                      title="Click student to view attended drives, rounds progress & offer letters"
                    >
                      <span
                        className="student-name-link"
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
                        {s.name}
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'inherit' }}>↗</span>
                      </span>
                    </td>
                    <td>{s.rollNumber}</td>
                    <td><span className="badge badge-info">{s.department}</span></td>
                    <td>{s.batch}</td>
                    <td>{s.cgpa}</td>
                    <td>
                      {s.careerPreference === 'Entrepreneurship' ? (
                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.25)', fontWeight: 600 }}>
                          🚀 Entrepreneur
                        </span>
                      ) : s.careerPreference === 'Higher Studies' ? (
                        <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#7c3aed', border: '1px solid rgba(139, 92, 246, 0.25)', fontWeight: 600 }}>
                          🎓 Higher Studies
                        </span>
                      ) : s.careerPreference === 'Government Job' ? (
                        <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.12)', color: '#0891b2', border: '1px solid rgba(6, 182, 212, 0.25)', fontWeight: 600 }}>
                          🏛️ Govt Job
                        </span>
                      ) : s.careerPreference === 'Other' ? (
                        <span className="badge" style={{ background: 'rgba(107, 114, 128, 0.12)', color: '#4b5563', border: '1px solid rgba(107, 114, 128, 0.25)', fontWeight: 600 }}>
                          🌐 Other
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontWeight: 500 }}>
                          💼 Placement
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'placed' ? 'badge-success' : 'badge-warning'}`}>
                        {s.status === 'placed' ? 'Placed' : 'Not Placed'}
                      </span>
                      {s.status === 'placed' && s.placementId?.companyId?.name && (
                        <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginTop: '2px' }}>
                          @ {s.placementId.companyId.name}
                        </div>
                      )}
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
          <div
            className="form-modal"
            style={{ maxWidth: '840px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="form-header">
              <h3 className="form-title">{editId ? 'Edit Student Profile' : 'Add New Student'}</h3>
              <button className="form-close" onClick={closeForm}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="form-body" style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
                
                {/* Section 1: Basic & Contact Information */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    👤 Personal & Contact Information
                  </h4>
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
                      <label className="form-label">Email Address *</label>
                      <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required placeholder="john@email.com" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number (10 Digits)</label>
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
                      <label className="form-label">Gender</label>
                      <select className="form-select" value={form.gender} onChange={(e) => setForm({...form, gender: e.target.value})}>
                        <option value="">Select Gender</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input className="form-input" type="date" value={form.dob} onChange={(e) => setForm({...form, dob: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* Section 2: Academic Credentials */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    🎓 Academic Credentials
                  </h4>
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
                      <label className="form-label">Cumulative GPA (CGPA)</label>
                      <input className="form-input" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={(e) => setForm({...form, cgpa: e.target.value})} placeholder="8.50" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">10th Board Marks (%)</label>
                      <input className="form-input" type="number" step="0.1" min="0" max="100" value={form.tenthPercentage} onChange={(e) => setForm({...form, tenthPercentage: e.target.value})} placeholder="88.5" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">12th / Diploma Marks (%)</label>
                      <input className="form-input" type="number" step="0.1" min="0" max="100" value={form.twelfthPercentage} onChange={(e) => setForm({...form, twelfthPercentage: e.target.value})} placeholder="85.0" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Current Standing Arrears</label>
                      <input className="form-input" type="number" min="0" value={form.currentArrears} onChange={(e) => setForm({...form, currentArrears: e.target.value})} placeholder="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">History of Arrears</label>
                      <input className="form-input" type="number" min="0" value={form.historyOfArrears} onChange={(e) => setForm({...form, historyOfArrears: e.target.value})} placeholder="0" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Career Goals & Placement Status */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    💼 Career & Placement Status
                  </h4>

                  {/* 1. Career Preference First */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Career Preference *</label>
                      <select
                        className="form-select"
                        value={form.careerPreference}
                        onChange={(e) => {
                          const val = e.target.value;
                          setForm({
                            ...form,
                            careerPreference: val,
                            // If not Placement, reset status to not_placed
                            status: val === 'Placement' ? form.status : 'not_placed',
                          });
                        }}
                      >
                        {CAREER_PREFERENCES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* 2. Placement Status (Active only when career preference is Placement) */}
                    {form.careerPreference === 'Placement' ? (
                      <div className="form-group">
                        <label className="form-label">Placement Status *</label>
                        <select
                          className="form-select"
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                          <option value="not_placed">Not Placed</option>
                          <option value="placed">Placed</option>
                        </select>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label className="form-label">Placement Status</label>
                        <div
                          style={{
                            padding: '9px 12px',
                            background: 'var(--bg-secondary, #f8fafc)',
                            border: '1px dashed var(--border-color, #cbd5e1)',
                            borderRadius: 'var(--radius-md, 8px)',
                            fontSize: '0.85rem',
                            color: 'var(--text-muted, #64748b)',
                            fontWeight: 600,
                          }}
                        >
                          Not Applicable ({form.careerPreference})
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contextual Career Details / Non-Placement Tracks */}
                  {form.careerPreference !== 'Placement' ? (
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {form.careerPreference === 'Entrepreneurship' && '🚀 Startup Details (Startup Name, Domain, Current Status):'}
                        {form.careerPreference === 'Higher Studies' && '🎓 Higher Studies Details (Target Degree, Field, Target Universities & Exams):'}
                        {form.careerPreference === 'Government Job' && '🏛️ Government Job Aspirations (Target Exam, e.g. UPSC CSE, TNPSC, GATE PSU):'}
                        {form.careerPreference === 'Other' && '🌐 Describe Career Path / Family Business:'}
                      </label>
                      <input
                        className="form-input"
                        value={form.careerDetails}
                        onChange={(e) => setForm({ ...form, careerDetails: e.target.value })}
                        placeholder={
                          form.careerPreference === 'Entrepreneurship'
                            ? 'e.g. Founder at TechVentures / SaaS MVP stage'
                            : form.careerPreference === 'Higher Studies'
                            ? 'e.g. MS in Computer Science in Germany / Preparing for GATE & GRE'
                            : form.careerPreference === 'Government Job'
                            ? 'e.g. Preparing for UPSC CSE / TNPSC Group 1'
                            : 'e.g. Family Business / Freelance Web Consultant'
                        }
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Career Goal Details (Optional)</label>
                      <input
                        className="form-input"
                        value={form.careerDetails}
                        onChange={(e) => setForm({ ...form, careerDetails: e.target.value })}
                        placeholder="e.g. Aiming for Core Systems Engineering / Product MNCs"
                      />
                    </div>
                  )}

                  {/* PLACEMENT & RECRUITMENT DRIVE DETAILS (Shown when careerPreference is Placement AND status is Placed) */}
                  {form.careerPreference === 'Placement' && form.status === 'placed' && (
                    <div
                      style={{
                        marginTop: '16px',
                        background: 'var(--bg-card-hover, #f8fafc)',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: 'var(--radius-lg, 12px)',
                        padding: '16px 18px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '14px',
                          borderBottom: '1px solid var(--border-color, #e2e8f0)',
                          paddingBottom: '8px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1.15rem' }}>🎯</span>
                          <div>
                            <h5 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              Placement & Recruitment Drive Details
                            </h5>
                            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Enter company name, drive mode (On-Campus or External Drive), role, and salary package
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            background: 'var(--bg-input, #f1f5f9)',
                            color: 'var(--text-secondary, #334155)',
                            border: '1px solid var(--border-color, #e2e8f0)',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Required for Placed
                        </span>
                      </div>

                      {/* Row 1: Company Name & Drive Category (On-Campus vs External) */}
                      <div className="form-row">
                        <div className="form-group" style={{ position: 'relative' }}>
                          <label className="form-label">
                            Recruiting Company Name *
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Google, Zoho, TCS, Infosys, Amazon"
                            value={form.placedCompany}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matched = companiesList.find(c => c.name?.toLowerCase() === val.toLowerCase());
                              setForm({
                                ...form,
                                placedCompany: val,
                                placedCompanyId: matched ? matched._id : '',
                              });
                            }}
                            list="registered-companies-list"
                            required
                          />
                          <datalist id="registered-companies-list">
                            {companiesList.map((c) => (
                              <option key={c._id} value={c.name}>
                                {c.industry ? `${c.name} (${c.industry})` : c.name}
                              </option>
                            ))}
                          </datalist>

                          {companiesList.length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Quick pick:</span>
                              {companiesList.slice(0, 5).map((c) => (
                                <button
                                  key={c._id}
                                  type="button"
                                  onClick={() => setForm({ ...form, placedCompany: c.name, placedCompanyId: c._id })}
                                  style={{
                                    background: form.placedCompany === c.name ? 'var(--accent-start, #0b1d37)' : 'var(--bg-secondary, #ffffff)',
                                    color: form.placedCompany === c.name ? '#ffffff' : 'var(--text-secondary, #334155)',
                                    border: '1px solid var(--border-color, #e2e8f0)',
                                    padding: '1px 8px',
                                    borderRadius: '10px',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {c.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Drive Category / Mode *
                          </label>
                          <select
                            className="form-select"
                            value={form.placedDriveType}
                            onChange={(e) => setForm({ ...form, placedDriveType: e.target.value })}
                            required
                          >
                            {DRIVE_TYPES.map((dt) => (
                              <option key={dt.value} value={dt.value}>
                                {dt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Row 2: Role Offered & Salary Package */}
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">
                            Job Role / Designation Offered *
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Software Engineer, Cloud Trainee, Systems Analyst"
                            value={form.placedRole}
                            onChange={(e) => setForm({ ...form, placedRole: e.target.value })}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">
                            Salary Package (CTC in LPA) *
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            className="form-input"
                            placeholder="e.g. 14.5"
                            value={form.placedPackage}
                            onChange={(e) => setForm({ ...form, placedPackage: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      {/* Row 3: Venue (ONLY for On-Campus Drive, NOT for External Drive) & Placement Date */}
                      {form.placedDriveType === 'on_campus' ? (
                        <div className="form-row">
                          <div className="form-group">
                            <label className="form-label">
                              Campus Drive Venue / Location (Optional)
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. College Placement Cell / Seminar Hall 1"
                              value={form.placedDriveDetails}
                              onChange={(e) => setForm({ ...form, placedDriveDetails: e.target.value })}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Placement / Offer Date *
                            </label>
                            <input
                              type="date"
                              className="form-input"
                              value={form.placedDate}
                              onChange={(e) => setForm({ ...form, placedDate: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="form-group">
                          <label className="form-label">
                            Placement / Offer Date *
                          </label>
                          <input
                            type="date"
                            className="form-input"
                            value={form.placedDate}
                            onChange={(e) => setForm({ ...form, placedDate: e.target.value })}
                            required
                          />
                        </div>
                      )}

                      {/* Row 4: Offer Letter Link (Optional) */}
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">
                          Offer Letter Document Link (Google Drive / Cloud URL - Optional)
                        </label>
                        <input
                          type="url"
                          className="form-input"
                          placeholder="https://drive.google.com/file/d/... or PDF link"
                          value={form.placedOfferLetterUrl}
                          onChange={(e) => setForm({ ...form, placedOfferLetterUrl: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 4: Skills & Online Profiles */}
                <div>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
                    🌐 Skills & Professional Portfolios
                  </h4>
                  <div className="form-group">
                    <label className="form-label">Technical Skills (comma separated)</label>
                    <input className="form-input" value={form.skills} onChange={(e) => setForm({...form, skills: e.target.value})} placeholder="React, Node.js, Python, DSA, SQL" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Resume Link (Google Drive / Cloud)</label>
                      <input className="form-input" value={form.resumeUrl} onChange={(e) => setForm({...form, resumeUrl: e.target.value})} placeholder="https://drive.google.com/file/..." />
                    </div>
                    <div className="form-group">
                      <label className="form-label">LinkedIn Profile URL</label>
                      <input className="form-input" value={form.linkedinUrl} onChange={(e) => setForm({...form, linkedinUrl: e.target.value})} placeholder="https://linkedin.com/in/username" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">GitHub Profile URL</label>
                      <input className="form-input" value={form.githubUrl} onChange={(e) => setForm({...form, githubUrl: e.target.value})} placeholder="https://github.com/username" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Portfolio Website URL</label>
                      <input className="form-input" value={form.portfolioUrl} onChange={(e) => setForm({...form, portfolioUrl: e.target.value})} placeholder="https://myportfolio.dev" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Permanent / Contact Address</label>
                    <textarea className="form-textarea" rows={2} value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} placeholder="House / Street, City, State, PIN" />
                  </div>
                </div>

              </div>
              <div className="form-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Update Student' : 'Add Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Detail & Attended Drives Progression Modal */}
      {viewStudent && (
        <StudentDetailModal
          student={viewStudent}
          onClose={() => setViewStudent(null)}
          onStudentUpdated={fetchStudents}
        />
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
