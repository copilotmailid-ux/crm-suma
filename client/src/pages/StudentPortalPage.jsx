import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDrives, applyForDrive } from '../api/driveApi';
import { getEvents, registerForEvent, unregisterFromEvent } from '../api/eventApi';
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
  HiOutlineClock,
  HiOutlineLocationMarker,
  HiOutlineSparkles,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineFilter,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import '../styles/studentPortal.css';

const tabTitles = {
  drives: 'Placement Drives',
  events: 'Training & Events',
  profile: 'Candidate Profile',
  password: 'Security Settings',
};

const StudentPortalPage = () => {
  const { student, logout, updateStudentProfile, changeStudentPassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'profile' | 'password'
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drives, setDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(true);
  const [searchDrive, setSearchDrive] = useState('');
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);
  const [selectedDrive, setSelectedDrive] = useState(null);

  const handleToggle = () => {
    if (window.innerWidth <= 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    email: '',
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
        email: student.email || '',
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

  // Training Events State
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchEvent, setSearchEvent] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [filterEligibleEventsOnly, setFilterEligibleEventsOnly] = useState(false);
  const [registeringEventId, setRegisteringEventId] = useState(null);

  // Fetch Events
  const fetchEventsList = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await getEvents();
      setEvents(res.data || []);
    } catch {
      toast.error('Failed to load training events');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    fetchEventsList();
  }, [fetchEventsList]);

  // Handle Register for Event
  const handleRegisterEvent = async (eventId, eventTitle) => {
    try {
      setRegisteringEventId(eventId);
      const res = await registerForEvent(eventId);
      toast.success(res.message || `Successfully registered for ${eventTitle}!`);
      fetchEventsList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register for event');
    } finally {
      setRegisteringEventId(null);
    }
  };

  // Handle Unregister from Event
  const handleUnregisterEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to cancel your enrollment in "${eventTitle}"?`)) return;
    try {
      setRegisteringEventId(eventId);
      const res = await unregisterFromEvent(eventId);
      toast.success(res.message || 'Enrollment cancelled');
      fetchEventsList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel enrollment');
    } finally {
      setRegisteringEventId(null);
    }
  };

  // Check if current student is registered for event
  const isStudentRegisteredForEvent = (evt) => {
    if (!student || !evt || !evt.attendance) return false;
    const sId = student._id?.toString();
    const roll = student.rollNumber?.toUpperCase();
    return evt.attendance.some(
      (a) =>
        (a.studentId && (a.studentId._id || a.studentId).toString() === sId) ||
        (a.rollNumber && a.rollNumber.toUpperCase() === roll)
    );
  };

  // Check student department & batch eligibility for event
  const checkEventEligibility = (evt) => {
    if (!student) return { eligible: false, message: 'Profile loading...' };
    const deptMatch = !evt.departments || evt.departments.length === 0 || evt.departments.includes(student.department);
    const batchMatch = !evt.eligibleBatches || evt.eligibleBatches.length === 0 || evt.eligibleBatches.includes(student.batch);
    if (!deptMatch) return { eligible: false, message: `Dept ${student.department} not eligible` };
    if (!batchMatch) return { eligible: false, message: `Batch ${student.batch} not eligible` };
    return { eligible: true, message: 'Eligible for your Dept & Batch' };
  };

  const upcomingEventsCount = events.filter((e) => e.status === 'Upcoming' || e.status === 'Ongoing').length;

  // Filtered Events
  const filteredEvents = events.filter((evt) => {
    const matchSearch =
      !searchEvent ||
      evt.title?.toLowerCase().includes(searchEvent.toLowerCase()) ||
      evt.chiefGuest?.toLowerCase().includes(searchEvent.toLowerCase()) ||
      evt.chiefGuestCompany?.toLowerCase().includes(searchEvent.toLowerCase()) ||
      evt.venue?.toLowerCase().includes(searchEvent.toLowerCase()) ||
      evt.description?.toLowerCase().includes(searchEvent.toLowerCase());

    const matchType = selectedEventType === 'all' || evt.eventType === selectedEventType;

    const matchEligible = !filterEligibleEventsOnly || checkEventEligibility(evt).eligible;

    return matchSearch && matchType && matchEligible;
  });

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


  // Get student's recruitment progression and round status for a drive
  const getStudentDriveStatus = (drive) => {
    if (!student || !drive) return null;
    const sId = student._id.toString();

    // 1. Check if finally placed / selected
    if (drive.finalSelectedStudents?.some((f) => (f.studentId?._id || f.studentId)?.toString() === sId)) {
      return {
        type: 'placed',
        title: '🏆 You Are Placed!',
        badge: 'Placed',
        message: 'Congratulations! Official placement offer for ' + drive.role + ' at ₹' + drive.package + ' LPA!',
        bg: '#f0fdf4',
        border: '#86efac',
        color: '#15803d',
      };
    }

    // 2. Check rounds
    if (drive.rounds && drive.rounds.length > 0) {
      for (let i = drive.rounds.length - 1; i >= 0; i--) {
        const r = drive.rounds[i];
        const cand = r.candidates?.find((c) => (c.studentId?._id || c.studentId)?.toString() === sId);
        if (cand) {
          if (cand.status === 'selected') {
            return {
              type: 'placed',
              title: '🏆 Selected & Placed!',
              badge: 'Placed',
              message: 'Cleared ' + r.name + '. Offer granted!',
              bg: '#f0fdf4',
              border: '#86efac',
              color: '#15803d',
            };
          }
          if (cand.status === 'shortlisted' || cand.status === 'pending') {
            const formattedDate = r.scheduledDate
              ? new Date(r.scheduledDate).toLocaleString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })
              : 'Schedule to be announced';

            return {
              type: 'round',
              title: '🎯 Shortlisted for ' + r.name,
              badge: 'Round ' + r.roundNumber,
              message: '📅 ' + formattedDate + ' • 📍 ' + (r.venue || 'Online / Campus'),
              bg: '#eff6ff',
              border: '#bfdbfe',
              color: '#1d4ed8',
            };
          }
          if (cand.status === 'eliminated') {
            const reasonText = cand.eliminationReason || cand.feedback;
            const remarksText = cand.eliminationRemarks;
            let msg = 'Selection rounds concluded for this drive.';
            if (reasonText && remarksText) {
              msg = `Reason: ${reasonText} • Feedback: ${remarksText}`;
            } else if (reasonText) {
              msg = `Reason for elimination: ${reasonText}`;
            }
            return {
              type: 'eliminated',
              title: 'Eliminated in ' + r.name,
              badge: 'Eliminated (Round ' + r.roundNumber + ')',
              reason: reasonText,
              remarks: remarksText,
              message: msg,
              bg: '#fef2f2',
              border: '#fecaca',
              color: '#dc2626',
            };
          }
        }
      }
    }

    const isRegistered = drive.registeredStudents?.some(
      (s) => (s._id || s).toString() === sId
    );
    if (isRegistered) {
      return {
        type: 'registered',
        title: '✓ Registered for Drive',
        badge: 'Registered',
        message: 'Your registration is confirmed. Awaiting round 1 screening.',
        bg: '#ecfdf5',
        border: '#a7f3d0',
        color: '#059669',
      };
    }

    return null;
  };


  const [preferredRole, setPreferredRole] = useState('');

  const handleApply = async (driveId, companyName, roleChoice = '') => {
    try {
      await applyForDrive(driveId, { preferredRole: roleChoice });
      toast.success(`Successfully registered for ${companyName} drive!`);
      fetchDrivesList();
      setPreferredRole('');
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
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Admin-styled Sidebar for Student Portal */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="/logo.png" alt="NSCET Logo" className="brand-logo-img" />
          <span className="brand-text" style={{ fontSize: '0.95rem' }}>NSCET</span>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Student Portal</span>

          <button
            type="button"
            className={`nav-item ${activeTab === 'drives' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('drives');
              setMobileOpen(false);
            }}
            style={{ width: '100%', border: 'none', textAlign: 'left', background: activeTab === 'drives' ? 'var(--accent-gradient)' : 'transparent' }}
          >
            <span className="nav-icon"><HiOutlineBriefcase /></span>
            <span className="nav-text">Placement Drives</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('events');
              setMobileOpen(false);
            }}
            style={{
              width: '100%',
              border: 'none',
              textAlign: 'left',
              background: activeTab === 'events' ? 'var(--accent-gradient)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="nav-icon"><HiOutlineAcademicCap /></span>
              <span className="nav-text">Training & Events</span>
            </div>
            {upcomingEventsCount > 0 && (
              <span
                style={{
                  background: activeTab === 'events' ? '#c59e51' : 'rgba(197, 158, 81, 0.25)',
                  color: activeTab === 'events' ? '#0b1d37' : '#c59e51',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px',
                }}
              >
                {upcomingEventsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setMobileOpen(false);
            }}
            style={{ width: '100%', border: 'none', textAlign: 'left', background: activeTab === 'profile' ? 'var(--accent-gradient)' : 'transparent' }}
          >
            <span className="nav-icon"><HiOutlineUser /></span>
            <span className="nav-text">My Profile</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('password');
              setMobileOpen(false);
            }}
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
              setMobileOpen(false);
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
              <button
                className="toggle-btn"
                onClick={handleToggle}
                id="sidebar-toggle"
                aria-label="Toggle Menu"
              >
                {mobileOpen || collapsed ? <HiOutlineMenu /> : <HiOutlineMenuAlt2 />}
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
              {/* Training & Placement Events Featured Advertisement Banner */}
              {upcomingEventsCount > 0 && (
                <div className="training-promo-banner">
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div className="promo-badge">
                      <HiOutlineSparkles /> Industry Masterclasses & Placement Training
                    </div>
                    <h3 className="promo-title">
                      Upskill with Corporate Trainers & Industry Experts
                    </h3>
                    <p className="promo-subtitle">
                      {upcomingEventsCount} technical workshops, mock interviews, and training bootcamps are open for student registration. View expert profiles and reserve your seat.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="promo-btn"
                    onClick={() => setActiveTab('events')}
                    style={{ position: 'relative', zIndex: 1 }}
                  >
                    <HiOutlineCalendar /> View Programs ({events.length})
                  </button>
                </div>
              )}

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

                        {/* Real-time Recruitment Round Progression Status */}
                        {(() => {
                          const statusObj = getStudentDriveStatus(drive);
                          if (!statusObj) return null;
                          return (
                            <div
                              style={{
                                background: statusObj.bg,
                                border: '1px solid ' + statusObj.border,
                                borderRadius: '8px',
                                padding: '10px 14px',
                                marginBottom: '12px',
                                fontSize: '0.82rem',
                                color: statusObj.color,
                              }}
                            >
                              <div style={{ fontWeight: 800, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{statusObj.title}</span>
                              </div>
                              <div style={{ opacity: 0.9 }}>{statusObj.message}</div>
                            </div>
                          );
                        })()}

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

          {/* TAB 2: TRAINING & EVENTS MODULES (ADVERTISED FOR STUDENTS) */}
          {activeTab === 'events' && (
            <div>
              {/* Filter & Search Bar */}
              <div className="student-filter-bar">
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Training Programs & Placement Events
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Industry expert seminars, technical workshops, aptitude bootcamps, and live mock drives
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div className="search-bar" style={{ minWidth: '240px' }}>
                    <HiOutlineSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search training topic, trainer, venue..."
                      value={searchEvent}
                      onChange={(e) => setSearchEvent(e.target.value)}
                    />
                  </div>

                  <select
                    className="filter-select"
                    value={selectedEventType}
                    onChange={(e) => setSelectedEventType(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                  >
                    <option value="all">All Event Categories</option>
                    <option value="Training">Training</option>
                    <option value="Technical Training">Technical Training</option>
                    <option value="Aptitude Training">Aptitude Training</option>
                    <option value="Soft Skills Training">Soft Skills Training</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Bootcamp">Bootcamp</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Mock Interview Drive">Mock Interview Drive</option>
                    <option value="Hackathon">Hackathon</option>
                  </select>

                  <label className="student-checkbox-pill">
                    <input
                      type="checkbox"
                      checked={filterEligibleEventsOnly}
                      onChange={(e) => setFilterEligibleEventsOnly(e.target.checked)}
                    />
                    Eligible for My Dept Only
                  </label>
                </div>
              </div>

              {loadingEvents ? (
                <Loader text="Loading training programs and event schedules..." />
              ) : filteredEvents.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎯</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>No Training Programs Found</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '6px auto 16px' }}>
                    No upcoming sessions match your current filter criteria. Try selecting "All Event Categories" or clearing search.
                  </p>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setSearchEvent('');
                      setSelectedEventType('all');
                      setFilterEligibleEventsOnly(false);
                    }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="student-events-grid">
                  {filteredEvents.map((evt) => {
                    const dateObj = evt.eventDate ? new Date(evt.eventDate) : new Date();
                    const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
                    const dayStr = dateObj.getDate();
                    const yearStr = dateObj.getFullYear();

                    const isMultiDay = evt.isMultiDay && evt.endDate;
                    const endDateObj = isMultiDay ? new Date(evt.endDate) : null;
                    const endMonthStr = endDateObj ? endDateObj.toLocaleString('en-US', { month: 'short' }) : '';
                    const endDayStr = endDateObj ? endDateObj.getDate() : '';
                    const dateRangeLabel = isMultiDay
                      ? (monthStr === endMonthStr ? `${monthStr} ${dayStr} – ${endDayStr}, ${yearStr}` : `${monthStr} ${dayStr} – ${endMonthStr} ${endDayStr}, ${yearStr}`)
                      : `${monthStr} ${dayStr}, ${yearStr}`;

                    const isRegistered = isStudentRegisteredForEvent(evt);
                    const { eligible, message: eligMsg } = checkEventEligibility(evt);
                    const totalReg = evt.attendance ? evt.attendance.length : 0;
                    const maxCap = evt.maxParticipants || 150;
                    const isFull = maxCap > 0 && totalReg >= maxCap;

                    const isTrainingType =
                      evt.eventType?.toLowerCase().includes('training') ||
                      evt.eventType === 'Bootcamp' ||
                      evt.eventType === 'Workshop';

                    return (
                      <div key={evt._id} className="student-event-card">
                        {/* Header with Date Badge & Title */}
                        <div className="student-event-header">
                          <div className="event-date-badge" style={{ minWidth: isMultiDay ? '64px' : '54px' }}>
                            <span className="month">{monthStr}</span>
                            <span className="day" style={{ fontSize: isMultiDay ? '1.05rem' : '1.35rem', lineHeight: 1.1 }}>
                              {isMultiDay ? `${dayStr}–${endDayStr}` : dayStr}
                            </span>
                            <span className="year">{yearStr}</span>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: isTrainingType ? '#f0fdf4' : '#eff6ff',
                                  color: isTrainingType ? '#16a34a' : '#1d4ed8',
                                  border: isTrainingType ? '1px solid #bbf7d0' : '1px solid #bfdbfe',
                                }}
                              >
                                {evt.eventType || 'Training'}
                              </span>

                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: evt.status === 'Completed' ? '#ecfdf5' : '#fef3c7',
                                  color: evt.status === 'Completed' ? '#059669' : '#b45309',
                                  border: evt.status === 'Completed' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                                }}
                              >
                                {evt.status || 'Upcoming'}
                              </span>

                              {isMultiDay && (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    padding: '2px 7px',
                                    borderRadius: '6px',
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    border: '1px solid #fde68a',
                                  }}
                                >
                                  🗓️ {evt.durationDays ? `${evt.durationDays} Days / ${evt.durationDays >= 6 ? Math.round(evt.durationDays / 6) + ' Wk' : evt.durationDays + 'D'}` : 'Multi-Day'}
                                </span>
                              )}

                              {eligible ? (
                                <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700, marginLeft: 'auto' }}>
                                  ✓ Eligible
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 600, marginLeft: 'auto' }}>
                                  ⚠️ Restricted
                                </span>
                              )}
                            </div>

                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                              {evt.title}
                            </h3>
                          </div>
                        </div>

                        {/* Body with Resource Person Details */}
                        <div className="student-event-body">
                          {/* Resource Person Spotlight */}
                          <div className="student-rp-card">
                            <div className="student-rp-avatar">
                              {evt.chiefGuest
                                ? evt.chiefGuest
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()
                                : 'RP'}
                            </div>

                            <div className="student-rp-info">
                              <span className="student-rp-role">
                                {isTrainingType ? '⭐ Resource Person / Trainer' : '⭐ Chief Guest / Speaker'}
                              </span>
                              <span className="student-rp-name">{evt.chiefGuest}</span>
                              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500 }}>
                                {evt.chiefGuestDesignation || 'Invited Industry Professional'}
                                {evt.chiefGuestCompany ? ` • ${evt.chiefGuestCompany}` : ''}
                              </span>

                              {evt.chiefGuestBio && (
                                <p className="student-rp-desc" style={{ margin: '4px 0 0' }}>
                                  {evt.chiefGuestBio}
                                </p>
                              )}

                              {(evt.chiefGuestEmail || evt.chiefGuestLinkedin) && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px', fontSize: '0.72rem' }}>
                                  {evt.chiefGuestEmail && <span style={{ color: '#64748b' }}>✉️ {evt.chiefGuestEmail}</span>}
                                  {evt.chiefGuestLinkedin && (
                                    <a
                                      href={evt.chiefGuestLinkedin}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}
                                    >
                                      🔗 Trainer LinkedIn
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Logistics: Time, Venue & Seats */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: '#475569' }}>
                            {isMultiDay && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 600 }}>
                                <HiOutlineCalendar style={{ color: '#d97706', fontSize: '1rem' }} />
                                <span>{dateRangeLabel} ({evt.durationDays || 'Multi'} Days Program)</span>
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <HiOutlineClock style={{ color: 'var(--accent-start, #0b1d37)', fontSize: '1rem' }} />
                                <span>{isMultiDay ? <strong>Daily: </strong> : null}{evt.startTime} – {evt.endTime || 'Wrap up'}</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <HiOutlineLocationMarker style={{ color: 'var(--accent-start, #0b1d37)', fontSize: '1rem' }} />
                                <span>{evt.venue}</span>
                              </div>
                            </div>

                            {isMultiDay && evt.dailyTimingNote && (
                              <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', paddingLeft: '22px' }}>
                                ℹ️ {evt.dailyTimingNote}
                              </div>
                            )}
                          </div>

                          {/* Capacity tracker */}
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <HiOutlineUserGroup /> Seat Availability
                              </span>
                              <span>
                                <strong>{totalReg}</strong> / {maxCap} Enrolled
                              </span>
                            </div>
                            <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${Math.min(100, Math.round((totalReg / maxCap) * 100))}%`,
                                  background: isFull ? '#ef4444' : 'var(--accent-gradient, #0b1d37)',
                                  borderRadius: '3px',
                                }}
                              />
                            </div>
                          </div>

                          {/* Pre-requisites */}
                          {evt.prerequisites && (
                            <div style={{ fontSize: '0.76rem', background: 'rgba(197, 158, 81, 0.08)', border: '1px solid rgba(197, 158, 81, 0.25)', borderRadius: '6px', padding: '6px 10px', color: '#854d0e' }}>
                              <strong>📌 Requirements:</strong> {evt.prerequisites}
                            </div>
                          )}

                          {/* Description / Agenda */}
                          {evt.description && (
                            <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                              {evt.description}
                            </p>
                          )}

                          {/* Department tags */}
                          <div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                              Participating Departments:
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {evt.departments?.map((d) => {
                                const isMyDept = d === student.department;
                                return (
                                  <span
                                    key={d}
                                    style={{
                                      fontSize: '0.72rem',
                                      fontWeight: 700,
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      background: isMyDept ? 'rgba(197, 158, 81, 0.2)' : '#f1f5f9',
                                      color: isMyDept ? '#b45309' : '#475569',
                                      border: isMyDept ? '1px solid rgba(197, 158, 81, 0.5)' : '1px solid transparent',
                                    }}
                                  >
                                    {d}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Footer with Enrollment Actions */}
                        <div className="student-event-footer">
                          <div>
                            <span style={{ fontSize: '0.74rem', color: '#64748b', display: 'block' }}>
                              {isRegistered ? 'Status: Confirmed Registration' : eligible ? 'Status: Open for Enrollment' : 'Eligibility: Not applicable'}
                            </span>
                          </div>

                          <div>
                            {isRegistered ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    background: '#dcfce7',
                                    color: '#15803d',
                                    border: '1px solid #86efac',
                                    fontWeight: 700,
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    fontSize: '0.8rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                >
                                  <HiOutlineCheckCircle /> Enrolled
                                </span>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#dc2626' }}
                                  disabled={registeringEventId === evt._id}
                                  onClick={() => handleUnregisterEvent(evt._id, evt.title)}
                                  title="Cancel Enrollment"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : eligible ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '7px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                disabled={registeringEventId === evt._id || isFull}
                                onClick={() => handleRegisterEvent(evt._id, evt.title)}
                              >
                                <HiOutlineSparkles />
                                {registeringEventId === evt._id
                                  ? 'Registering...'
                                  : isFull
                                  ? 'Seats Full'
                                  : 'Register for Training'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.65, cursor: 'not-allowed' }}
                                disabled
                                title={eligMsg}
                              >
                                Not Eligible
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

          {/* TAB 3: EDIT PLACEMENT PROFILE */}
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
                {/* Section 1: Personal & Contact Information */}
                <div className="profile-section-title">
                  <HiOutlineUser /> 1. Personal & Contact Information
                </div>
                <div className="profile-form-grid" style={{ marginBottom: '24px' }}>
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
                    <label className="form-label">College / Personal Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="student@college.edu"
                      required
                    />
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

                {/* Section 2: Academic Credentials */}
                <div className="profile-section-title">
                  <HiOutlineAcademicCap /> 2. Academic Credentials
                </div>
                <div className="profile-form-grid" style={{ marginBottom: '24px' }}>
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
                </div>

                {/* Section 3: Career Track & Placement Aspiration */}
                <div className="profile-section-title">
                  <HiOutlineTrendingUp /> 3. Career Track & Placement Aspiration
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

                {/* Section 4: Skills & Professional Portfolios */}
                <div className="profile-section-title">
                  <HiOutlineExternalLink /> 4. Skills & Professional Portfolios
                </div>
                <div className="profile-form-grid">
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
                  {selectedDrive.roles && selectedDrive.roles.length > 1 && (
                    <div style={{ marginTop: '16px', background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: '6px' }}>
                        Select Preferred Job Role (Optional):
                      </label>
                      <select
                        className="form-select"
                        value={preferredRole}
                        onChange={(e) => setPreferredRole(e.target.value)}
                        style={{ width: '100%', background: '#ffffff', padding: '8px 10px', fontSize: '0.85rem' }}
                      >
                        <option value="">Any Role / Open to all roles offered</option>
                        {selectedDrive.roles.map((r, i) => (
                          <option key={i} value={r}>{r}</option>
                        ))}
                      </select>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px' }}>
                        Multiple roles available: {selectedDrive.roles.join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setSelectedDrive(null); setPreferredRole(''); }}
                  >
                    Close
                  </button>
                  {checkEligibility(selectedDrive).eligible && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleApply(selectedDrive._id, selectedDrive.companyName, preferredRole)}
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
