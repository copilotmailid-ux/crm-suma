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
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineCash,
  HiOutlineSearch,
  HiOutlineIdentification,
  HiOutlineDocumentText,
  HiOutlineTrendingUp,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import '../styles/studentPortal.css';

const StudentPortalPage = () => {
  const { student, logout, updateStudentProfile, changeStudentPassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'profile' | 'password'
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
      reasons.push(`Requires minimum ${drive.minCgpa} CGPA (You have ${student.cgpa || 0})`);
    }

    // Arrears check
    if (
      drive.maxCurrentArrears !== undefined &&
      Number(student.currentArrears || 0) > drive.maxCurrentArrears
    ) {
      reasons.push(
        `Max allowed standing arrears is ${drive.maxCurrentArrears} (You have ${student.currentArrears || 0})`
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

  const filteredDrives = drives.filter((d) => {
    if (filterEligibleOnly) {
      return checkEligibility(d).eligible;
    }
    return true;
  });

  return (
    <div className="student-portal-layout">
      {/* Navbar */}
      <header className="student-navbar">
        <div className="student-navbar-inner">
          <div className="student-nav-brand">
            <img src="/logo.png" alt="SKCET" />
            <div>
              <div className="student-brand-title">Sri Krishna College of Eng & Tech</div>
              <div className="student-brand-sub">Student Placement Portal</div>
            </div>
          </div>

          <div className="student-nav-tabs">
            <button
              className={`student-nav-tab ${activeTab === 'drives' ? 'active' : ''}`}
              onClick={() => setActiveTab('drives')}
            >
              <HiOutlineBriefcase /> Placement Drives
            </button>
            <button
              className={`student-nav-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <HiOutlineUser /> My Profile
            </button>
            <button
              className={`student-nav-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              <HiOutlineLockClosed /> Security
            </button>
          </div>

          <div className="student-nav-user">
            <div className="student-user-pill">
              <div className="student-user-name">{student.name}</div>
              <div className="student-user-roll">{student.rollNumber} • {student.department}</div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/student/login');
              }}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              title="Logout"
            >
              <HiOutlineLogout /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="student-portal-content">
        {/* Hero Section */}
        <section className="student-hero">
          <div>
            <h1 className="student-hero-title">Welcome back, {student.name.split(' ')[0]}! 👋</h1>
            <p className="student-hero-sub">
              Manage your academic credentials, review company recruitment drives, and apply directly.
            </p>
          </div>

          <div className="student-stat-badges">
            <div className="student-stat-pill">
              Roll No: <strong>{student.rollNumber}</strong>
            </div>
            <div className="student-stat-pill">
              CGPA: <strong>{student.cgpa || '0.0'}</strong>
            </div>
            <div className="student-stat-pill">
              Live Arrears: <strong style={{ color: Number(student.currentArrears) > 0 ? '#ef4444' : '#10b981' }}>{student.currentArrears || 0}</strong>
            </div>
            <div className="student-stat-pill">
              Career Goal:{' '}
              <strong
                style={{
                  color:
                    profileForm.careerPreference === 'Entrepreneurship'
                      ? '#3b82f6'
                      : profileForm.careerPreference === 'Higher Studies'
                      ? '#8b5cf6'
                      : profileForm.careerPreference === 'Government Job'
                      ? '#06b6d4'
                      : profileForm.careerPreference === 'Other'
                      ? '#6b7280'
                      : '#10b981',
                }}
              >
                {profileForm.careerPreference === 'Entrepreneurship'
                  ? 'Entrepreneur 🚀'
                  : profileForm.careerPreference === 'Higher Studies'
                  ? 'Higher Studies (PG) 🎓'
                  : profileForm.careerPreference === 'Government Job'
                  ? 'Govt Job 🏛️'
                  : profileForm.careerPreference === 'Other'
                  ? 'Other 🌐'
                  : 'Placement 💼'}
              </strong>
            </div>
            <div className="student-stat-pill">
              Status:{' '}
              <strong style={{ color: student.status === 'placed' ? '#10b981' : '#f59e0b' }}>
                {student.status === 'placed' ? 'Placed 🎓' : 'Not Placed'}
              </strong>
            </div>
          </div>
        </section>

        {/* TAB 1: PLACEMENT DRIVES */}
        {activeTab === 'drives' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Visiting Companies & Campus Drives
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Showing drives entered by Placement Administration with real-time eligibility evaluation
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

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
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
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Placement Candidate Profile
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Keep your academic, personal, and career links updated. Any changes made here are instantly visible to the Placement Cell Admin.
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
                  border: '1px solid rgba(0,0,0,0.07)',
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
                      rows={2}
                      placeholder={
                        profileForm.careerPreference === 'Entrepreneurship'
                          ? 'e.g. AgriTech IoT Solutions - Smart irrigation startup, prototype ready'
                          : profileForm.careerPreference === 'Higher Studies'
                          ? 'e.g. Planning MS in Computer Science in Germany / USA for Fall 2026. Target: TU Munich, CMU. GRE: 320'
                          : profileForm.careerPreference === 'Government Job'
                          ? 'e.g. Preparing for UPSC Civil Services Examination and GATE PSU recruitment'
                          : 'e.g. Joining family manufacturing business / Independent freelance developer'
                      }
                      value={profileForm.careerDetails}
                      onChange={(e) => setProfileForm({ ...profileForm, careerDetails: e.target.value })}
                    />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      💡 This choice will be automatically updated on the Placement Cell Admin portal so the administration can track your career aspirations accurately.
                    </p>
                  </div>
                )}
              </div>

              {/* Section 3: Academic Record */}
              <div className="profile-section-title">
                <HiOutlineDocumentText /> 3. Academic Records & Arrears (Eligibility Critical)
              </div>
              <div className="profile-form-grid">
                <div className="form-group">
                  <label className="form-label">10th Standard Board Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-input"
                    placeholder="e.g. 88.5"
                    value={profileForm.tenthPercentage}
                    onChange={(e) => setProfileForm({ ...profileForm, tenthPercentage: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">12th / Diploma Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="form-input"
                    placeholder="e.g. 91.2"
                    value={profileForm.twelfthPercentage}
                    onChange={(e) => setProfileForm({ ...profileForm, twelfthPercentage: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Degree CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    className="form-input"
                    placeholder="e.g. 8.65"
                    value={profileForm.cgpa}
                    onChange={(e) => setProfileForm({ ...profileForm, cgpa: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Live Standing Arrears (Count)</label>
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
                  <label className="form-label">History of Arrears (Total)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={profileForm.historyOfArrears}
                    onChange={(e) => setProfileForm({ ...profileForm, historyOfArrears: e.target.value })}
                  />
                </div>
              </div>

              {/* Section 3: Technical Skills & Career Links */}
              <div className="profile-section-title">
                <HiOutlineBriefcase /> 3. Skills, Resume & Career Portfolios
              </div>
              <div className="profile-form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Skills & Tech Stack (Comma-separated)</label>
                  <input
                    className="form-input"
                    placeholder="React, Node.js, Python, AWS, Docker, Java"
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm({ ...profileForm, skills: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Resume Link (Google Drive / Cloud URL)
                    {profileForm.resumeUrl && (
                      <a
                        href={profileForm.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginLeft: 8, fontSize: '0.75rem', textDecoration: 'underline' }}
                      >
                        Test Open <HiOutlineExternalLink style={{ verticalAlign: 'middle' }} />
                      </a>
                    )}
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://drive.google.com/..."
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
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Choose a secure password that is at least 6 characters long.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repeat new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  required
                />
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
      </main>
    </div>
  );
};

export default StudentPortalPage;
