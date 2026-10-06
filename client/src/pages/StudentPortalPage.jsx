import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDrives, applyForDrive } from '../api/driveApi';
import {
  HiOutlineBriefcase,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineLogout,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineExternalLink,
  HiOutlineSearch,
  HiOutlineIdentification,
  HiOutlineTrendingUp,
  HiOutlineAcademicCap,
  HiOutlineMenu,
  HiOutlineMenuAlt2,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import '../styles/studentPortal.css';

const tabTitles = {
  drives: 'Placement Drives',
  profile: 'Candidate Profile',
  password: 'Security Settings',
};

const StudentPortalPage = () => {
  const { student, logout, updateStudentProfile, changeStudentPassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'profile' | 'password'
  const [collapsed, setCollapsed] = useState(false);
  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [searchDrive, setSearchDrive] = useState('');
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    phone: '',
    gender: '',
    dob: '',
    careerPreference: 'Placement',
    careerDetails: '',
    tenthPercentage: '',
    twelfthPercentage: '',
    currentArrears: '0',
    historyOfArrears: '0',
    cgpa: '',
    skills: '',
    resumeUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    address: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Sync profile form when student data loads
  useEffect(() => {
    if (student) {
      setProfileForm({
        phone: student.phone || '',
        gender: student.gender || '',
        dob: student.dob || '',
        careerPreference: student.careerPreference || 'Placement',
        careerDetails: student.careerDetails || '',
        tenthPercentage: student.tenthPercentage !== undefined ? String(student.tenthPercentage) : '',
        twelfthPercentage: student.twelfthPercentage !== undefined ? String(student.twelfthPercentage) : '',
        currentArrears: student.currentArrears !== undefined ? String(student.currentArrears) : '0',
        historyOfArrears: student.historyOfArrears !== undefined ? String(student.historyOfArrears) : '0',
        cgpa: student.cgpa !== undefined ? String(student.cgpa) : '',
        skills: Array.isArray(student.skills) ? student.skills.join(', ') : '',
        resumeUrl: student.resumeUrl || '',
        linkedinUrl: student.linkedinUrl || '',
        githubUrl: student.githubUrl || '',
        portfolioUrl: student.portfolioUrl || '',
        address: student.address || '',
      });
    }
  }, [student]);

  // Fetch Drives
  const fetchDrivesList = useCallback(async () => {
    setLoadingDrives(true);
    try {
      const res = await getDrives({ search: searchDrive });
      setDrives(res.data);
    } catch {
      toast.error('Failed to load placement drives');
    } finally {
      setLoadingDrives(false);
    }
  }, [searchDrive]);

  useEffect(() => {
    fetchDrivesList();
  }, [fetchDrivesList]);

  // Helper for student initials
  const getInitials = (name) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Evaluate Eligibility
  const checkEligibility = (drive) => {
    if (!student) return { eligible: false, reasons: ['Profile loading...'] };

    const reasons = [];

    // Department check
    if (
      drive.eligibleDepartments &&
      drive.eligibleDepartments.length > 0 &&
      !drive.eligibleDepartments.includes(student.department)
    ) {
      reasons.push(`Your department (${student.department}) is not eligible`);
    }

    // CGPA check
    if (drive.minCgpa && Number(student.cgpa || 0) < drive.minCgpa) {
      reasons.push(`Requires min ${drive.minCgpa} CGPA (You have ${student.cgpa || 0})`);
    }

    // Arrears check
    if (
      drive.maxCurrentArrears !== undefined &&
      Number(student.currentArrears || 0) > drive.maxCurrentArrears
    ) {
      reasons.push(
        `Max allowed arrears: ${drive.maxCurrentArrears} (You have ${student.currentArrears || 0})`
      );
    }

    // 10th Marks check
    if (drive.minTenthMarks && Number(student.tenthPercentage || 0) < drive.minTenthMarks) {
      reasons.push(`Requires ${drive.minTenthMarks}% in 10th`);
    }

    // 12th Marks check
    if (drive.minTwelfthMarks && Number(student.twelfthPercentage || 0) < drive.minTwelfthMarks) {
      reasons.push(`Requires ${drive.minTwelfthMarks}% in 12th/Diploma`);
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  };

  const handleApply = async (driveId, companyName) => {
    try {
      await applyForDrive(driveId);
      toast.success(`Successfully registered for ${companyName} drive!`);
      fetchDrivesList();
      if (selectedDrive) setSelectedDrive(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateStudentProfile(profileForm);
      toast.success('Placement profile updated successfully! (Synced with Admin)');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setChangingPassword(true);
    try {
      await changeStudentPassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!student) return <Loader />;

  const eligibleDrivesCount = drives.filter((d) => checkEligibility(d).eligible).length;

  const filteredDrives = drives.filter((d) => {
    if (filterEligibleOnly) {
      return checkEligibility(d).eligible;
    }
    return true;
  });

  return (
    <div className="app-layout">
      {/* Admin-styled Sidebar for Student Portal */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="NSCET Logo" className="brand-logo-img" />
          <span className="brand-text" style={{ fontSize: '0.95rem' }}>NSCET</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Student Portal</span>

          <button
            type="button"
            className={`nav-item ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => setActiveTab('drives')}
            style={{ width: '100%', border: 'none', textAlign: 'left', background: activeTab === 'drives' ? 'var(--accent-gradient)' : 'transparent' }}
          >
            <span className="nav-icon"><HiOutlineBriefcase /></span>
            <span className="nav-text">Placement Drives</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            style={{ width: '100%', border: 'none', textAlign: 'left', background: activeTab === 'profile' ? 'var(--accent-gradient)' : 'transparent' }}
          >
            <span className="nav-icon"><HiOutlineUser /></span>
            <span className="nav-text">My Profile</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
            style={{ width: '100%', border: 'none', textAlign: 'left', background: activeTab === 'password' ? 'var(--accent-gradient)' : 'transparent' }}
          >
            <span className="nav-icon"><HiOutlineLockClosed /></span>
            <span className="nav-text">Security</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-item"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            style={{ width: '100%', border: 'none', background: 'transparent' }}
          >
            <span className="nav-icon"><HiOutlineLogout /></span>
            <span className="nav-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* Admin-styled Main Content */}
      <main className={`main-content ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Admin-styled Topbar */}
        <header className="topbar">
          <div className="topbar-container">
            <div className="topbar-left">
              <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)} id="sidebar-toggle">
                {collapsed ? <HiOutlineMenu /> : <HiOutlineMenuAlt2 />}
              </button>
              <h1 className="page-title">{tabTitles[activeTab] || 'Student Portal'}</h1>
            </div>
            <div className="topbar-right">
              <div className="admin-badge">
                <div className="admin-avatar">{getInitials(student.name)}</div>
                <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
                  <span className="admin-name">{student.name}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {student.rollNumber} • {student.department}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with smooth fade-in */}
        <div className="page-content fade-in" key={activeTab}>
          {/* College Placement Banner */}
          <div className="dashboard-banner">
            <div className="banner-logo-wrapper">
              <img src="/logo.png" alt="NSCET Logo" className="banner-logo" />
            </div>
            <div className="banner-info">
              <h2 className="banner-title">Nadar Saraswathi College of Engineering and Technology</h2>
              <p className="banner-subtitle">Theni, Tamil Nadu, India</p>
              <div className="banner-badge">
                <span>TRAINING & PLACEMENT CELL • STUDENT PORTAL</span>
              </div>
            </div>
          </div>

          {/* Admin-style Stat Cards Grid */}
          <div className="dashboard-stats">
            <div className="stat-card purple">
              <div className="stat-icon purple"><HiOutlineBriefcase /></div>
              <div className="stat-info">
                <span className="stat-label">Available Drives</span>
                <span className="stat-value">{drives.length}</span>
              </div>
            </div>

            <div className="stat-card green">
              <div className="stat-icon green"><HiOutlineCheckCircle /></div>
              <div className="stat-info">
                <span className="stat-label">Eligible for You</span>
                <span className="stat-value">{eligibleDrivesCount}</span>
              </div>
            </div>

            <div className="stat-card blue">
              <div className="stat-icon blue"><HiOutlineAcademicCap /></div>
              <div className="stat-info">
                <span className="stat-label">CGPA & Standing Arrears</span>
                <span className="stat-value">
                  {student.cgpa || '0.0'}{' '}
                  <span style={{ fontSize: '0.82rem', color: Number(student.currentArrears) > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                    ({student.currentArrears || 0} arr)
                  </span>
                </span>
              </div>
            </div>

            <div className="stat-card yellow">
              <div className="stat-icon yellow"><HiOutlineTrendingUp /></div>
              <div className="stat-info">
                <span className="stat-label">Career Track / Status</span>
                <span className="stat-value" style={{ fontSize: '1.05rem' }}>
                  {profileForm.careerPreference || 'Placement'}
                </span>
              </div>
            </div>
          </div>

          {/* TAB 1: PLACEMENT DRIVES */}
          {activeTab === 'drives' && (
            <div>
              <div className="student-filter-bar">
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Campus Placement Drives
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Active company recruitments entered by Placement Administration with real-time eligibility
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="search-bar" style={{ minWidth: '240px' }}>
                    <HiOutlineSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search company or role..."
                      value={searchDrive}
                      onChange={(e) => setSearchDrive(e.target.value)}
                    />
                  </div>

                  <label className="student-checkbox-pill">
                    <input
                      type="checkbox"
                      checked={filterEligibleOnly}
                      onChange={(e) => setFilterEligibleOnly(e.target.checked)}
                    />
                    Eligible for Me Only
                  </label>
                </div>
              </div>

              {loadingDrives ? (
                <Loader />
              ) : filteredDrives.length === 0 ? (
                <div className="empty-state">
                  <p>No placement drives found matching your criteria.</p>
                </div>
              ) : (
                <div className="drives-grid">
                  {filteredDrives.map((drive) => {
                    const { eligible, reasons } = checkEligibility(drive);
                    const isRegistered = drive.registeredStudents?.some(
                      (s) => (s._id || s).toString() === student._id.toString()
                    );

                    return (
                      <div key={drive._id} className="drive-card">
                        <div className="drive-card-header">
                          <div>
                            <div className="drive-company-name">{drive.companyName}</div>
                            <div className="drive-role-title">{drive.role}</div>
                          </div>
                          <div className="drive-package-badge">
                            ₹{drive.package} LPA
                          </div>
                        </div>

                        <div className="drive-criteria-list">
                          <div className="criteria-item">
                            <span className="criteria-label">Min CGPA</span>
                            <span className="criteria-val">{drive.minCgpa || 'No Bar'}</span>
                          </div>
                          <div className="criteria-item">
                            <span className="criteria-label">Max Arrears</span>
                            <span className="criteria-val">{drive.maxCurrentArrears ?? 0}</span>
                          </div>
                          <div className="criteria-item">
                            <span className="criteria-label">Location</span>
                            <span className="criteria-val">{drive.jobLocation || 'Pan India'}</span>
                          </div>
                          <div className="criteria-item">
                            <span className="criteria-label">Drive Date</span>
                            <span className="criteria-val">
                              {new Date(drive.driveDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Eligibility Box */}
                        <div className={`drive-eligibility-box ${eligible ? 'eligible' : 'ineligible'}`}>
                          {eligible ? (
                            <>
                              <HiOutlineCheckCircle style={{ fontSize: '1.2rem', flexShrink: 0 }} />
                              <div>
                                <strong>You are Eligible!</strong>
                                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                                  You satisfy the CGPA, arrears, and department criteria.
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <HiOutlineXCircle style={{ fontSize: '1.2rem', flexShrink: 0 }} />
                              <div>
                                <strong>Not Eligible</strong>
                                <div style={{ fontSize: '0.75rem' }}>{reasons.join(' • ')}</div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="drive-card-footer">
                          <span className="drive-deadline-text">
                            Deadline: {new Date(drive.registrationDeadline).toLocaleDateString('en-IN')}
                          </span>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={() => setSelectedDrive(drive)}
                            >
                              Details
                            </button>

                            {isRegistered ? (
                              <span className="badge badge-success" style={{ padding: '6px 12px' }}>
                                ✓ Registered
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                                disabled={!eligible}
                                onClick={() => handleApply(drive._id, drive.companyName)}
                              >
                                Apply Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EDIT PLACEMENT PROFILE */}
          {activeTab === 'profile' && (
            <div className="profile-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Placement Candidate Profile
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Keep your academic, personal, and career links updated. All updates instantly sync to the Placement Cell Admin.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit}>
                {/* Section 1: College Institutional Info */}
                <div className="profile-section-title">
                  <HiOutlineIdentification /> 1. College Institutional Records
                </div>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Student Full Name <span className="readonly-badge">Locked by College</span>
                    </label>
                    <input className="form-input" value={student.name} readOnly disabled />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Roll Number <span className="readonly-badge">Locked by College</span>
                    </label>
                    <input className="form-input" value={student.rollNumber} readOnly disabled />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Department <span className="readonly-badge">Locked by College</span>
                    </label>
                    <input className="form-input" value={student.department} readOnly disabled />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Batch <span className="readonly-badge">Locked by College</span>
                    </label>
                    <input className="form-input" value={student.batch} readOnly disabled />
                  </div>

                  <div className="form-group">
                    <label className="form-label">College Email</label>
                    <input className="form-input" value={student.email} readOnly disabled />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Phone Number *</label>
                    <input
                      className="form-input"
                      value={profileForm.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) setProfileForm({ ...profileForm, phone: val });
                      }}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-select"
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      className="form-input"
                      value={profileForm.dob}
                      onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                    />
                  </div>
                </div>

                {/* Career Goal & Placement Preference */}
                <div className="profile-section-title">
                  <HiOutlineTrendingUp /> 2. Career Track & Placement Aspiration
                </div>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.02)',
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '24px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div className="form-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      Select Your Career Goal / Placement Opt-In *
                    </label>
                    <select
                      className="form-select"
                      value={profileForm.careerPreference}
                      onChange={(e) => setProfileForm({ ...profileForm, careerPreference: e.target.value })}
                      style={{ fontSize: '0.92rem', fontWeight: 600, padding: '10px 14px' }}
                    >
                      <option value="Placement">💼 Campus Placement (Looking for Campus Placements & Company Offers)</option>
                      <option value="Entrepreneurship">🚀 Entrepreneurship / Startup Founder (Building Own Venture)</option>
                      <option value="Higher Studies">🎓 Higher Studies / Post Graduation (PG - MS / M.Tech / MBA / PhD)</option>
                      <option value="Government Job">🏛️ Government Jobs & Civil Services (UPSC / GATE / TNPSC / Defense / Banking)</option>
                      <option value="Other">🌐 Other / Family Business / Freelance</option>
                    </select>
                  </div>

                  {profileForm.careerPreference !== 'Placement' && (
                    <div className="form-group" style={{ marginTop: '12px' }}>
                      <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {profileForm.careerPreference === 'Entrepreneurship' && '🚀 Startup Details (Startup Name, Domain, Current Status):'}
                        {profileForm.careerPreference === 'Higher Studies' && '🎓 Higher Studies Details (Target Degree, Field, Target Universities & Exams like GRE/GATE/CAT):'}
                        {profileForm.careerPreference === 'Government Job' && '🏛️ Government Job Aspirations (Target Exam, e.g. UPSC CSE, TNPSC, IES, GATE PSU):'}
                        {profileForm.careerPreference === 'Other' && '🌐 Describe Your Career Path / Family Business:'}
                      </label>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Provide details about your venture, exams, or universities..."
                        value={profileForm.careerDetails}
                        onChange={(e) => setProfileForm({ ...profileForm, careerDetails: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Academic Scores & Arrears */}
                <div className="profile-section-title">
                  <HiOutlineAcademicCap /> 3. Academic Scores & Arrears Tracking
                </div>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label className="form-label">Cumulative GPA (CGPA)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      className="form-input"
                      placeholder="e.g. 8.45"
                      value={profileForm.cgpa}
                      onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Standing Arrears</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      value={profileForm.currentArrears}
                      onChange={(e) => setProfileForm({ ...profileForm, currentArrears: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">History of Arrears</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="0"
                      value={profileForm.historyOfArrears}
                      onChange={(e) => setProfileForm({ ...profileForm, historyOfArrears: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">10th Standard Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-input"
                      placeholder="e.g. 91.5"
                      value={profileForm.tenthPercentage}
                      onChange={(e) => setProfileForm({ ...profileForm, tenthPercentage: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">12th / Diploma Percentage (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-input"
                      placeholder="e.g. 89.2"
                      value={profileForm.twelfthPercentage}
                      onChange={(e) => setProfileForm({ ...profileForm, twelfthPercentage: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Technical Skills (Comma separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. React, Node.js, Python, Java, AWS, Docker"
                      value={profileForm.skills}
                      onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                    />
                  </div>
                </div>

                {/* Resume and Professional Links */}
                <div className="profile-section-title">
                  <HiOutlineExternalLink /> 4. Resume & Professional Links
                </div>
                <div className="profile-form-grid">
                  <div className="form-group">
                    <label className="form-label">Resume Link (Google Drive / Cloud)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://drive.google.com/file/d/..."
                      value={profileForm.resumeUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, resumeUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://linkedin.com/in/username"
                      value={profileForm.linkedinUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">GitHub Profile URL</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://github.com/username"
                      value={profileForm.githubUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, githubUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Portfolio / Personal Website</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://yourportfolio.dev"
                      value={profileForm.portfolioUrl}
                      onChange={(e) => setProfileForm({ ...profileForm, portfolioUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Current / Permanent Address</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="Enter city, state, postal code"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '12px 28px', fontSize: '0.95rem' }}
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Saving & Syncing...' : 'Save & Sync Placement Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: CHANGE PASSWORD */}
          {activeTab === 'password' && (
            <div className="profile-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
                Change Student Account Password
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Choose a secure password that is at least 6 characters long.
              </p>

              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">Current Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showCurrentPw ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter current password"
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      aria-label={showCurrentPw ? 'Hide password' : 'Show password'}
                      title={showCurrentPw ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPw ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      className="form-input"
                      placeholder="At least 6 characters"
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowNewPw(!showNewPw)}
                      aria-label={showNewPw ? 'Hide password' : 'Show password'}
                      title={showNewPw ? 'Hide password' : 'Show password'}
                    >
                      {showNewPw ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Confirm New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Repeat new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      aria-label={showConfirmPw ? 'Hide password' : 'Show password'}
                      title={showConfirmPw ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPw ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px' }}
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Drive Detail Modal */}
          {selectedDrive && (
            <div className="form-overlay" onClick={() => setSelectedDrive(null)}>
              <div className="form-modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
                <div className="form-header">
                  <div>
                    <h3 className="form-title">{selectedDrive.companyName}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {selectedDrive.role} • ₹{selectedDrive.package} LPA
                    </div>
                  </div>
                  <button className="form-close" onClick={() => setSelectedDrive(null)}>
                    ×
                  </button>
                </div>

                <div className="form-body">
                  <div className="detail-grid" style={{ marginBottom: '16px' }}>
                    <div className="detail-field">
                      <span className="detail-label">Location</span>
                      <span className="detail-value">{selectedDrive.jobLocation}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">Drive Date</span>
                      <span className="detail-value">
                        {new Date(selectedDrive.driveDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">Min CGPA</span>
                      <span className="detail-value">{selectedDrive.minCgpa}</span>
                    </div>
                    <div className="detail-field">
                      <span className="detail-label">Max Standing Arrears</span>
                      <span className="detail-value">{selectedDrive.maxCurrentArrears ?? 0}</span>
                    </div>
                    <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="detail-label">Eligible Departments</span>
                      <span className="detail-value">
                        {selectedDrive.eligibleDepartments?.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                      Selection Rounds & Process:
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.02)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                      {selectedDrive.selectionProcess}
                    </p>
                  </div>

                  {selectedDrive.jobDescription && (
                    <div style={{ marginBottom: '14px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                        Job Description & Requirements:
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {selectedDrive.jobDescription}
                      </p>
                    </div>
                  )}

                  {selectedDrive.applicationLink && (
                    <div style={{ marginTop: '12px' }}>
                      <a
                        href={selectedDrive.applicationLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        Official Application Link <HiOutlineExternalLink />
                      </a>
                    </div>
                  )}
                </div>

                <div className="form-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedDrive(null)}
                  >
                    Close
                  </button>
                  {checkEligibility(selectedDrive).eligible && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleApply(selectedDrive._id, selectedDrive.companyName)}
                    >
                      Register / Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentPortalPage;
