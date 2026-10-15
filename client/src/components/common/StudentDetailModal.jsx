import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineUpload,
  HiOutlineEye,
  HiOutlineDownload,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineDocumentText,
  HiOutlineOfficeBuilding,
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineArrowRight,
  HiOutlineExternalLink,
  HiOutlinePrinter,
  HiOutlineCheck,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import {
  getStudentDrives,
  uploadStudentOfferLetter,
  deleteStudentOfferLetter,
} from '../../api/studentApi';
import Loader from './Loader';
import '../../styles/studentDetailModal.css';

const StudentDetailModal = ({
  student,
  onClose,
  initialTab = 'drives',
  onStudentUpdated = null,
}) => {
  // Lock body scroll while modal is open
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const [activeTab, setActiveTab] = useState(initialTab); // 'drives' | 'offers' | 'profile'
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(student || {});
  const [drives, setDrives] = useState([]);
  const [placements, setPlacements] = useState([]);

  // Search & Filters for Drives
  const [driveSearch, setDriveSearch] = useState('');
  const [driveFilterStatus, setDriveFilterStatus] = useState('all'); // 'all' | 'placed' | 'in_progress' | 'eliminated' | 'registered'

  // Offer Letter Import Submodal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTargetDrive, setImportTargetDrive] = useState(null); // null if general placement
  const [importForm, setImportForm] = useState({
    file: null,
    fileDataUrl: '',
    fileName: '',
    fileSizeStr: '',
    externalUrl: '',
  });
  const [importing, setImporting] = useState(false);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState(null); // { url, name }

  // Prevent background scrolling
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  // Fetch full student drives and placement history
  const fetchDrivesHistory = useCallback(async () => {
    if (!student?._id) return;
    setLoading(true);
    try {
      const res = await getStudentDrives(student._id);
      if (res.data) {
        setStudentData(res.data.student || student);
        setDrives(res.data.drives || []);
        setPlacements(res.data.placements || []);
      }
    } catch {
      toast.error('Failed to load student drives and placement history');
    } finally {
      setLoading(false);
    }
  }, [student]);

  useEffect(() => {
    fetchDrivesHistory();
  }, [fetchDrivesHistory]);

  // Derived counts & stats
  const totalDrives = drives.length;
  const placedDrives = useMemo(() => drives.filter((d) => d.isPlaced), [drives]);
  const isStudentPlaced = studentData.status === 'placed' || placedDrives.length > 0;
  const eliminatedDrives = useMemo(() => drives.filter((d) => d.isEliminated), [drives]);
  const inProgressDrives = useMemo(
    () => drives.filter((d) => !d.isPlaced && !d.isEliminated && d.highestRoundNumber > 0),
    [drives]
  );

  const highestPackage = useMemo(() => {
    if (placements && placements.length > 0) {
      const maxPkg = Math.max(...placements.map((p) => Number(p.package) || 0));
      if (maxPkg > 0) return maxPkg;
    }
    const placedDrive = drives.find((d) => d.isPlaced && d.package);
    if (placedDrive && placedDrive.package) return placedDrive.package;
    return null;
  }, [placements, drives]);

  // Filtered drives list
  const filteredDrives = useMemo(() => {
    return drives.filter((d) => {
      const matchesSearch =
        d.companyName?.toLowerCase().includes(driveSearch.toLowerCase()) ||
        d.role?.toLowerCase().includes(driveSearch.toLowerCase()) ||
        d.title?.toLowerCase().includes(driveSearch.toLowerCase());

      if (!matchesSearch) return false;

      if (driveFilterStatus === 'placed') return d.isPlaced;
      if (driveFilterStatus === 'eliminated') return d.isEliminated;
      if (driveFilterStatus === 'in_progress')
        return !d.isPlaced && !d.isEliminated && d.highestRoundNumber > 0;
      if (driveFilterStatus === 'registered')
        return !d.isPlaced && !d.isEliminated && d.highestRoundNumber === 0;

      return true;
    });
  }, [drives, driveSearch, driveFilterStatus]);

  // Handle file selection for offer letter import
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size exceeds 15MB limit. Please upload a smaller file or provide a cloud link.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const sizeKb = (file.size / 1024).toFixed(1);
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKb} KB`;
      setImportForm({
        file,
        fileDataUrl: reader.result,
        fileName: file.name,
        fileSizeStr: sizeStr,
        externalUrl: '',
      });
    };
    reader.readAsDataURL(file);
  };

  // Open import modal for specific drive or general placement
  const handleOpenImport = (drive = null) => {
    setImportTargetDrive(drive);
    setImportForm({
      file: null,
      fileDataUrl: '',
      fileName: drive ? `${drive.companyName}_Offer_Letter.pdf` : `Offer_Letter_${studentData.rollNumber}.pdf`,
      fileSizeStr: '',
      externalUrl: '',
    });
    setShowImportModal(true);
  };

  // Submit offer letter import
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    const finalUrl = importForm.fileDataUrl || importForm.externalUrl?.trim();
    if (!finalUrl) {
      toast.error('Please select a file to upload or enter a document URL');
      return;
    }

    setImporting(true);
    try {
      const payload = {
        offerLetterUrl: finalUrl,
        offerLetterName: importForm.fileName.trim() || 'Offer_Letter.pdf',
        driveId: importTargetDrive?._id || null,
        placementId: importTargetDrive?.finalSelectedInfo?.placementId || null,
      };

      await uploadStudentOfferLetter(studentData._id, payload);
      toast.success(
        importTargetDrive
          ? `Offer letter imported successfully for ${importTargetDrive.companyName}!`
          : 'Offer letter imported successfully!'
      );
      setShowImportModal(false);
      await fetchDrivesHistory();
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import offer letter');
    } finally {
      setImporting(false);
    }
  };

  // Remove offer letter
  const handleDeleteOfferLetter = async (drive = null) => {
    if (!window.confirm('Are you sure you want to remove this offer letter?')) return;
    try {
      await deleteStudentOfferLetter(studentData._id, {
        driveId: drive?._id || null,
        placementId: drive?.finalSelectedInfo?.placementId || null,
      });
      toast.success('Offer letter removed');
      await fetchDrivesHistory();
      if (onStudentUpdated) onStudentUpdated();
    } catch {
      toast.error('Failed to remove offer letter');
    }
  };

  // Trigger download of offer letter
  const handleDownloadOffer = (url, name) => {
    if (!url) return;
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name || 'Offer_Letter.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.open(url, '_blank');
    }
  };

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div className="sd-overlay" onClick={onClose}>
      <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
        {/* ========================================================================= */}
        {/* MODAL HEADER: STUDENT IDENTITY & STATUS OVERVIEW (Pure White Card Style) */}
        {/* ========================================================================= */}
        <div className="sd-header">
          <div className="sd-header-left">
            <div className="sd-avatar">
              {studentData.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'ST'}
            </div>
            <div className="sd-name-wrap">
              <h2>
                {studentData.name}
                {highestPackage && (
                  <span
                    className="sd-badge-pill"
                    style={{
                      background: '#ecfdf5',
                      color: '#059669',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    ₹{highestPackage} LPA
                  </span>
                )}
                {isStudentPlaced ? (
                  <span
                    className="sd-badge-pill"
                    style={{
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a',
                    }}
                  >
                    🏆 Placed Candidate
                  </span>
                ) : (
                  <span
                    className="sd-badge-pill"
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    In Placement Drives
                  </span>
                )}
                <span
                  className="sd-badge-pill"
                  style={{
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {studentData.department}
                </span>
              </h2>
              <div className="sd-header-subtitle">
                <span>Roll No: <strong>{studentData.rollNumber}</strong></span>
                <span>•</span>
                <span>Batch: <strong>{studentData.batch}</strong></span>
                <span>•</span>
                <span>CGPA: <strong>{studentData.cgpa || '0.0'}</strong></span>
                <span>•</span>
                <span>Live Arrears: <strong>{studentData.liveArrears ?? 0}</strong></span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="sd-close-btn"
              onClick={onClose}
              title="Close"
            >
              <HiOutlineX />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB NAVIGATION BAR (Matching CompanyDriveModal)                           */}
        {/* ========================================================================= */}
        <div className="sd-tabs-bar">
          <div className="sd-tabs-left">
            <button
              type="button"
              className={`sd-tab-btn ${activeTab === 'drives' ? 'active' : ''}`}
              onClick={() => setActiveTab('drives')}
            >
              <HiOutlineBriefcase style={{ fontSize: '1.15rem' }} />
              <span>Attended Drives</span>
              <span className="sd-tab-badge">{totalDrives} Drives</span>
            </button>

            <button
              type="button"
              className={`sd-tab-btn ${activeTab === 'offers' ? 'active' : ''}`}
              onClick={() => setActiveTab('offers')}
            >
              <HiOutlineSparkles style={{ fontSize: '1.15rem' }} />
              <span>Final Placed & Offers</span>
              <span className="sd-tab-badge">{placedDrives.length}</span>
            </button>

            <button
              type="button"
              className={`sd-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <HiOutlineAcademicCap style={{ fontSize: '1.15rem' }} />
              <span>Academic Profile</span>
            </button>
          </div>

          <div>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                color: '#1e293b',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <HiOutlinePrinter /> Print / Export Profile
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODAL BODY CONTENT                                                        */}
        {/* ========================================================================= */}
        <div className="sd-body">
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Loader />
              <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
                Loading student drive participation & progression...
              </p>
            </div>
          ) : activeTab === 'drives' ? (
            /* ===================================================================== */
            /* TAB 1: ATTENDED DRIVES & ROUNDS TRACKING                              */
            /* ===================================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Stat Badges Row (matching CompanyDriveModal lines 1475-1520) */}
              <div className="sd-stats-strip">
                <div className="sd-stat-card">
                  <div className="sd-stat-number">{totalDrives}</div>
                  <div className="sd-stat-title">ATTENDED DRIVES</div>
                </div>
                <div className="sd-stat-card blue">
                  <div className="sd-stat-number">{inProgressDrives.length}</div>
                  <div className="sd-stat-title">ACTIVE ROUNDS</div>
                </div>
                <div className="sd-stat-card green">
                  <div className="sd-stat-number">{placedDrives.length}</div>
                  <div className="sd-stat-title">PLACEMENT OFFERS</div>
                </div>
                <div className="sd-stat-card red">
                  <div className="sd-stat-number">{eliminatedDrives.length}</div>
                  <div className="sd-stat-title">ELIMINATIONS</div>
                </div>
              </div>

              {/* Toolbar: Search and Filter Pills */}
              <div className="sd-drives-toolbar">
                <div className="sd-search-box">
                  <HiOutlineSearch />
                  <input
                    type="text"
                    placeholder="Search by company or role..."
                    value={driveSearch}
                    onChange={(e) => setDriveSearch(e.target.value)}
                  />
                </div>

                <div className="sd-filter-group">
                  {[
                    { id: 'all', label: `All (${totalDrives})` },
                    { id: 'placed', label: `Placed (${placedDrives.length})` },
                    { id: 'in_progress', label: `In Progress (${inProgressDrives.length})` },
                    { id: 'eliminated', label: `Eliminated (${eliminatedDrives.length})` },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setDriveFilterStatus(filter.id)}
                      className={`sd-filter-pill ${driveFilterStatus === filter.id ? 'active' : ''}`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drives List */}
              {filteredDrives.length === 0 ? (
                <div className="sd-empty-state">
                  <div className="sd-empty-icon">
                    <HiOutlineOfficeBuilding />
                  </div>
                  <h4 className="sd-empty-title">No placement drives found</h4>
                  <p className="sd-empty-desc">
                    {totalDrives === 0
                      ? 'This student has not registered for or attended any campus placement drives yet.'
                      : 'No drives match the current search or status filter.'}
                  </p>
                </div>
              ) : (
                filteredDrives.map((d) => (
                  <div
                    key={d._id}
                    className={`sd-drive-card ${d.isPlaced ? 'is-placed' : ''}`}
                  >
                    {/* Drive Header */}
                    <div className="sd-drive-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="sd-company-avatar">
                          {d.companyName ? d.companyName.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div className="sd-drive-title-group">
                          <h3>
                            {d.companyName}
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
                              — {d.role}
                            </span>
                          </h3>
                          <div className="sd-drive-submeta">
                            <span
                              style={{
                                background: '#ecfdf5',
                                color: '#059669',
                                border: '1px solid #a7f3d0',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.78rem',
                              }}
                            >
                              ₹{d.package} LPA
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Date:</strong>{' '}
                              {d.driveDate ? new Date(d.driveDate).toLocaleDateString('en-IN') : '-'}
                            </span>
                            <span>•</span>
                            <span>{d.jobLocation || 'Pan India'}</span>
                            <span>•</span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                background:
                                  d.status === 'Completed'
                                    ? '#f1f5f9'
                                    : d.status === 'Ongoing'
                                    ? '#eff6ff'
                                    : '#fef3c7',
                                color:
                                  d.status === 'Completed'
                                    ? '#475569'
                                    : d.status === 'Ongoing'
                                    ? '#1d4ed8'
                                    : '#b45309',
                              }}
                            >
                              Drive: {d.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Overall Status Badge */}
                      <div>
                        {d.isPlaced ? (
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #fde68a',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            🏆 Placed & Selected
                          </span>
                        ) : d.isEliminated ? (
                          <span
                            style={{
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <HiOutlineXCircle /> {d.overallStatus}
                          </span>
                        ) : d.highestRoundNumber > 0 ? (
                          <span
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <HiOutlineClock /> {d.overallStatus}
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#f1f5f9',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            Registered / Applied
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Round-by-Round Visual Stepper Cards (Matching Placement Drive UI) */}
                    <div className="sd-stepper-wrap">
                      <div className="sd-stepper-title">
                        <span>Recruitment Rounds Progression</span>
                        <span>
                          {d.isPlaced
                            ? 'Cleared All Rounds ✓'
                            : d.isEliminated
                            ? `Eliminated at Round ${d.eliminatedRound?.roundNumber || ''}`
                            : d.highestRoundNumber > 0
                            ? `Moved up to Round ${d.highestRoundNumber}`
                            : 'Registration Confirmed'}
                        </span>
                      </div>

                      <div className="sd-rounds-chain">
                        {/* Step 0: Registration */}
                        <div className="sd-pipeline-card cleared">
                          <div className="sd-pipeline-circle">✓</div>
                          <div className="sd-pipeline-info">
                            <div className="sd-pipeline-name">Registered</div>
                            <div className="sd-pipeline-sub">Application Confirmed</div>
                          </div>
                          <span className="sd-pipeline-badge done">✓ Done</span>
                        </div>

                        {/* Drive Rounds */}
                        {(d.rounds || []).map((round, rIdx) => {
                          const isCleared = round.candidateStatus === 'selected';
                          const isInProg = round.candidateStatus === 'pending' || round.candidateStatus === 'shortlisted';
                          const isElim = round.candidateStatus === 'eliminated';

                          const cardClass = isCleared
                            ? 'cleared'
                            : isInProg
                            ? 'in_progress'
                            : isElim
                            ? 'eliminated'
                            : 'scheduled';

                          return (
                            <div key={round.roundNumber || rIdx} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <HiOutlineArrowRight style={{ color: '#cbd5e1', fontSize: '0.9rem', flexShrink: 0 }} />
                              <div
                                className={`sd-pipeline-card ${cardClass}`}
                                title={`${round.name} (${round.type}) - Status: ${round.candidateStatus}`}
                              >
                                <div className="sd-pipeline-circle">
                                  {isCleared ? '✓' : isElim ? '✕' : round.roundNumber}
                                </div>
                                <div className="sd-pipeline-info">
                                  <div className="sd-pipeline-name">
                                    Round {round.roundNumber}: {round.name}
                                  </div>
                                  <div className="sd-pipeline-sub">
                                    {isCleared
                                      ? 'Advanced to Next Stage'
                                      : isInProg
                                      ? 'Active / Evaluating'
                                      : isElim
                                      ? 'Eliminated'
                                      : 'Scheduled Stage'}
                                  </div>
                                </div>
                                {isCleared ? (
                                  <span className="sd-pipeline-badge done">✓ Done</span>
                                ) : isInProg ? (
                                  <span className="sd-pipeline-badge active">Active</span>
                                ) : isElim ? (
                                  <span className="sd-pipeline-badge eliminated">✕ Eliminated</span>
                                ) : (
                                  <span className="sd-pipeline-badge scheduled">Scheduled</span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Final Offer Node */}
                        <HiOutlineArrowRight style={{ color: '#cbd5e1', fontSize: '0.9rem', flexShrink: 0 }} />
                        <div className={`sd-pipeline-card ${d.isPlaced ? 'cleared' : 'scheduled'}`}>
                          <div
                            className="sd-pipeline-circle"
                            style={{
                              background: d.isPlaced ? '#fef3c7' : '#f1f5f9',
                              color: d.isPlaced ? '#b45309' : '#94a3b8',
                            }}
                          >
                            🏆
                          </div>
                          <div className="sd-pipeline-info">
                            <div className="sd-pipeline-name">Final Offer</div>
                            <div className="sd-pipeline-sub">
                              {d.isPlaced ? 'Job Placement Secured' : 'Selection Offer'}
                            </div>
                          </div>
                          {d.isPlaced ? (
                            <span className="sd-pipeline-badge done" style={{ background: '#fef3c7', color: '#b45309' }}>
                              ✓ Placed
                            </span>
                          ) : (
                            <span className="sd-pipeline-badge scheduled">Pending</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Elimination Reason Details if applicable */}
                    {d.isEliminated && d.eliminatedRound && (
                      <div className="sd-elimination-box">
                        <HiOutlineXCircle style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <div style={{ fontWeight: 700 }}>
                            Eliminated in Round {d.eliminatedRound.roundNumber}: {d.eliminatedRound.roundName}
                          </div>
                          <div style={{ marginTop: '2px', color: '#7f1d1d' }}>
                            <strong>Reason:</strong> {d.eliminatedRound.reason || 'Not Specified'}
                            {d.eliminatedRound.remarks && (
                              <span> • <strong>Remarks / Feedback:</strong> {d.eliminatedRound.remarks}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Offer Letter Box for Placed Drives */}
                    {d.isPlaced && (
                      <div>
                        {d.offerLetter?.url ? (
                          <div className="sd-offer-box">
                            <div className="sd-offer-info">
                              <div className="sd-offer-icon">
                                <HiOutlineDocumentText />
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.9rem' }}>
                                  Official Offer Letter Imported ✓
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                                  {d.offerLetter.name} • Uploaded{' '}
                                  {d.offerLetter.uploadedAt
                                    ? new Date(d.offerLetter.uploadedAt).toLocaleDateString('en-IN')
                                    : 'Recently'}
                                </div>
                              </div>
                            </div>

                            <div className="sd-offer-actions">
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: d.offerLetter.url,
                                    name: d.offerLetter.name,
                                  })
                                }
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '4px 10px',
                                  background: '#ffffff',
                                  color: '#065f46',
                                  border: '1px solid #a7f3d0',
                                }}
                              >
                                <HiOutlineEye /> View Offer Letter ↗
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleDownloadOffer(d.offerLetter.url, d.offerLetter.name)}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '4px 10px',
                                  background: '#ffffff',
                                  color: '#065f46',
                                  border: '1px solid #a7f3d0',
                                }}
                              >
                                <HiOutlineDownload /> Download
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleOpenImport(d)}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '4px 10px',
                                  background: '#ffffff',
                                  color: '#0284c7',
                                  border: '1px solid #bae6fd',
                                }}
                                title="Replace existing offer letter file"
                              >
                                <HiOutlineUpload /> Replace
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleDeleteOfferLetter(d)}
                                style={{
                                  fontSize: '0.78rem',
                                  padding: '4px 8px',
                                }}
                                title="Remove offer letter"
                              >
                                <HiOutlineTrash />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="sd-import-callout">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.3rem' }}>🎉</span>
                              <div>
                                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.88rem' }}>
                                  Candidate Placed at {d.companyName}!
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#b45309' }}>
                                  No offer letter document has been uploaded for this drive yet.
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleOpenImport(d)}
                              style={{
                                background: 'linear-gradient(135deg, #c59e51 0%, #b45309 100%)',
                                border: 'none',
                                color: '#ffffff',
                                fontSize: '0.82rem',
                                padding: '6px 14px',
                                fontWeight: 700,
                                boxShadow: '0 4px 12px rgba(180, 83, 9, 0.3)',
                              }}
                            >
                              <HiOutlineUpload /> Import Offer Letter on Drive
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'offers' ? (
            /* ===================================================================== */
            /* TAB 2: OFFER LETTERS & PLACEMENTS CONSOLIDATED VIEW                   */
            /* ===================================================================== */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {isStudentPlaced ? (
                <div
                  style={{
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                    border: '1px solid #a7f3d0',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: '#10b981',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        boxShadow: '0 6px 16px rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      <HiOutlineSparkles />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: '#065f46', fontWeight: 800 }}>
                        Candidate is Successfully Placed!
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: '#047857' }}>
                        Official placement records and offer letter files for {studentData.name} ({studentData.rollNumber}).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOpenImport(null)}
                    style={{
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      border: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      gap: '8px',
                    }}
                  >
                    <HiOutlineUpload /> Import / Upload New Offer Letter
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-main, #f8fafc)',
                    border: '1px dashed var(--border-color, #cbd5e1)',
                    borderRadius: '16px',
                    padding: '36px 24px',
                    textAlign: 'center',
                  }}
                >
                  <HiOutlineBriefcase style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '8px' }} />
                  <h4 style={{ margin: '0 0 6px', color: 'var(--text-primary)' }}>No placement offers recorded yet</h4>
                  <p style={{ margin: '0 0 16px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    Track ongoing interview rounds in the Attended Drives tab, or import an off-campus offer letter below.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleOpenImport(null)}
                  >
                    <HiOutlineUpload /> Import Off-Campus Offer Letter
                  </button>
                </div>
              )}

              {/* Offers Table */}
              <div
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <h4 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  📄 Placement Offers & Offer Letter Documents
                </h4>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Role / Designation</th>
                        <th>Package</th>
                        <th>Offer Type</th>
                        <th>Placement Date</th>
                        <th>Offer Letter Document</th>
                        <th style={{ textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {placedDrives.length === 0 && placements.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                            No offer records available.
                          </td>
                        </tr>
                      ) : (
                        // Combine drive placed records & placement documents
                        placedDrives.map((d, idx) => {
                          const ol = d.offerLetter;
                          return (
                            <tr key={d._id || idx}>
                              <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <HiOutlineOfficeBuilding style={{ color: '#0284c7' }} />
                                  {d.companyName}
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{d.finalSelectedInfo?.role || d.role}</td>
                              <td>
                                <span
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    color: '#059669',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontWeight: 700,
                                  }}
                                >
                                  ₹{d.finalSelectedInfo?.package || d.package} LPA
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-info">On-Campus Drive</span>
                              </td>
                              <td>
                                {d.finalSelectedInfo?.placementDate
                                  ? new Date(d.finalSelectedInfo.placementDate).toLocaleDateString('en-IN')
                                  : '-'}
                              </td>
                              <td>
                                {ol?.url ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <HiOutlineDocumentText style={{ color: '#059669', fontSize: '1.2rem' }} />
                                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46' }}>
                                      {ol.name || 'Offer_Letter.pdf'}
                                    </span>
                                  </div>
                                ) : (
                                  <span style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: 600 }}>
                                    ⚠️ Pending Import
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                  {ol?.url ? (
                                    <>
                                      <button
                                        type="button"
                                        className="btn-icon btn-secondary"
                                        onClick={() => setPreviewDoc({ url: ol.url, name: ol.name })}
                                        title="View Offer Letter ↗"
                                      >
                                        <HiOutlineEye />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-icon btn-secondary"
                                        onClick={() => handleDownloadOffer(ol.url, ol.name)}
                                        title="Download Offer Letter"
                                      >
                                        <HiOutlineDownload />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-icon btn-secondary"
                                        onClick={() => handleOpenImport(d)}
                                        title="Replace file"
                                      >
                                        <HiOutlineUpload />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-icon btn-danger"
                                        onClick={() => handleDeleteOfferLetter(d)}
                                        title="Delete file"
                                      >
                                        <HiOutlineTrash />
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-secondary"
                                      onClick={() => handleOpenImport(d)}
                                      style={{ padding: '3px 10px', fontSize: '0.78rem' }}
                                    >
                                      <HiOutlineUpload /> Import
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ===================================================================== */
            /* TAB 3: COMPLETE ACADEMIC PROFILE                                      */
            /* ===================================================================== */
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <h4 style={{ margin: '0 0 20px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                👤 Student Academic & Contact Credentials
              </h4>

              <div className="detail-grid">
                <div className="detail-field">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value" style={{ fontWeight: 700 }}>{studentData.name}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Roll Number</span>
                  <span className="detail-value">
                    <code style={{ fontSize: '0.9rem', fontWeight: 700 }}>{studentData.rollNumber}</code>
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">
                    {studentData.email ? (
                      <a
                        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${studentData.email}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#0284c7', textDecoration: 'underline' }}
                      >
                        {studentData.email}
                      </a>
                    ) : '-'}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Phone Number</span>
                  <span className="detail-value">{studentData.phone || '-'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Department</span>
                  <span className="detail-value">
                    <span className="badge badge-info">{studentData.department}</span>
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Academic Batch</span>
                  <span className="detail-value">{studentData.batch}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Cumulative GPA (CGPA)</span>
                  <span className="detail-value" style={{ fontWeight: 800, color: '#0284c7', fontSize: '1.05rem' }}>
                    {studentData.cgpa || '0.0'}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Current Standing Arrears</span>
                  <span className="detail-value">
                    <span className={`badge ${Number(studentData.currentArrears) > 0 ? 'badge-warning' : 'badge-neutral'}`}>
                      {studentData.currentArrears || 0}
                    </span>
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">History of Arrears</span>
                  <span className="detail-value">{studentData.historyOfArrears || 0}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">10th Board Marks</span>
                  <span className="detail-value">
                    {studentData.tenthPercentage ? `${studentData.tenthPercentage}%` : '-'}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">12th / Diploma Marks</span>
                  <span className="detail-value">
                    {studentData.twelfthPercentage ? `${studentData.twelfthPercentage}%` : '-'}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Placement Status</span>
                  <span className={`badge ${isStudentPlaced ? 'badge-success' : 'badge-warning'}`}>
                    {isStudentPlaced ? 'Placed' : 'Not Placed'}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Resume Link</span>
                  <span className="detail-value">
                    {studentData.resumeUrl ? (
                      <a
                        href={studentData.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '3px 10px', fontSize: '0.78rem', textDecoration: 'none' }}
                      >
                        Open Resume ↗
                      </a>
                    ) : '-'}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">LinkedIn Profile</span>
                  <span className="detail-value">
                    {studentData.linkedinUrl ? (
                      <a href={studentData.linkedinUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
                        LinkedIn Profile ↗
                      </a>
                    ) : '-'}
                  </span>
                </div>
                <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Skills & Technical Competencies</span>
                  <span className="detail-value">
                    {(studentData.skills || []).length > 0 ? (
                      studentData.skills.map((s, i) => (
                        <span key={i} className="badge badge-neutral" style={{ marginRight: 6, marginBottom: 4 }}>
                          {s}
                        </span>
                      ))
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="sd-footer">
          <div className="sd-footer-left">
            Viewing records for <strong>{studentData.name}</strong> ({studentData.rollNumber}) • Student ID: <code>{studentData._id}</code>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onClose}
            style={{
              padding: '8px 24px',
              background: '#1e293b',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Done / Close
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-MODAL: IMPORT OFFER LETTER                                            */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="sd-submodal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="sd-submodal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                📥 Import Offer Letter
              </h3>
              <button
                type="button"
                className="form-close"
                onClick={() => setShowImportModal(false)}
              >
                ×
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Upload the official offer letter for <strong>{studentData.name}</strong>
              {importTargetDrive && (
                <span>
                  {' '}
                  at <strong>{importTargetDrive.companyName}</strong> ({importTargetDrive.role})
                </span>
              )}
              .
            </p>

            <form onSubmit={handleImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* File Dropzone */}
              <label
                className={`sd-dropzone ${importForm.file ? 'has-file' : ''}`}
                style={{
                  borderColor: importForm.file ? '#10b981' : undefined,
                  background: importForm.file ? '#ecfdf5' : undefined,
                }}
              >
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: importForm.file ? '#d1fae5' : '#f1f5f9',
                    color: importForm.file ? '#059669' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                  }}
                >
                  <HiOutlineUpload />
                </div>
                {importForm.file ? (
                  <div>
                    <div style={{ fontWeight: 700, color: '#065f46', fontSize: '0.9rem' }}>
                      {importForm.fileName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                      {importForm.fileSizeStr} • Click to replace file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      Click to choose PDF or Image file
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Supports PDF, PNG, JPG up to 15MB
                    </div>
                  </div>
                )}
              </label>

              {/* Or Cloud Link Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Or Document / Google Drive Link:
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://drive.google.com/file/d/... or document URL"
                  value={importForm.externalUrl}
                  onChange={(e) =>
                    setImportForm({ ...importForm, externalUrl: e.target.value })
                  }
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              {/* Offer Letter Display Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Offer Letter File / Title Name:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. TCS_Digital_Offer_Letter.pdf"
                  value={importForm.fileName}
                  onChange={(e) =>
                    setImportForm({ ...importForm, fileName: e.target.value })
                  }
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={importing || (!importForm.fileDataUrl && !importForm.externalUrl?.trim())}
                  style={{ minWidth: '140px', justifyContent: 'center' }}
                >
                  {importing ? 'Importing...' : 'Save Offer Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-MODAL: DOCUMENT PREVIEW MODAL                                         */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="sd-submodal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="sd-doc-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-doc-preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <HiOutlineDocumentText style={{ fontSize: '1.3rem', color: '#38bdf8' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{previewDoc.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleDownloadOffer(previewDoc.url, previewDoc.name)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                  }}
                >
                  <HiOutlineDownload /> Download
                </button>
                <button
                  type="button"
                  className="sd-close-btn"
                  onClick={() => setPreviewDoc(null)}
                >
                  <HiOutlineX />
                </button>
              </div>
            </div>

            <div className="sd-doc-preview-body">
              {previewDoc.url.startsWith('data:image/') ||
              previewDoc.url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                <img src={previewDoc.url} alt={previewDoc.name} />
              ) : previewDoc.url.startsWith('data:application/pdf') ||
                previewDoc.url.includes('.pdf') ? (
                <iframe src={previewDoc.url} title={previewDoc.name} />
              ) : (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <HiOutlineExternalLink style={{ fontSize: '3rem', color: '#0284c7', marginBottom: '12px' }} />
                  <h4 style={{ margin: '0 0 8px' }}>Cloud Document Link</h4>
                  <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    This offer letter is hosted externally (e.g. Google Drive / Cloud).
                  </p>
                  <a
                    href={previewDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none' }}
                  >
                    Open Document in New Tab ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default StudentDetailModal;
