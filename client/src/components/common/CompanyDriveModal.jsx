import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
  HiOutlineSearch,
  HiOutlineDownload,
  HiOutlineExternalLink,
  HiOutlineBriefcase,
  HiOutlineCalendar,
  HiOutlineLocationMarker,
  HiOutlineAcademicCap,
  HiOutlineDocumentText,
  HiOutlineMail,
  HiOutlineArrowRight,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineCog,
  HiOutlineRefresh,
  HiOutlineExclamation,
} from 'react-icons/hi';
import * as XLSX from 'xlsx';
import {
  getDriveCandidates,
  advanceRoundCandidates,
  selectFinalCandidates,
  addOrUpdateRound,
  resendRoundEmail,
  resendOfferEmail,
} from '../../api/driveApi';
import Loader from './Loader';
import toast from 'react-hot-toast';

const CompanyDriveModal = ({ drive, onClose }) => {
  // Lock body scroll while modal is open
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  // Tabs: 'pipeline' (Rounds) | 'placed' | 'registered' | 'eligible' | 'info'
  const [activeTab, setActiveTab] = useState('pipeline');
  const [loading, setLoading] = useState(true);

  // Drive & Pipeline State
  const [driveData, setDriveData] = useState(drive || {});
  const [rounds, setRounds] = useState([]);
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState(1);
  const [finalSelectedStudents, setFinalSelectedStudents] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [eligibleStudents, setEligibleStudents] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roundSearchQuery, setRoundSearchQuery] = useState('');
  const [eligibleFilter, setEligibleFilter] = useState('all');

  // Checkbox Selection for Active Round
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [resendingId, setResendingId] = useState(null);

  // Modal: Advance to Next Round ("When is 2nd round" + Mail)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    nextRoundNumber: 2,
    nextRoundName: 'Round 2: Technical Interview',
    scheduledDate: '',
    venue: 'College CS Lab 3 / Online (Google Meet)',
    instructions:
      'Please report 15 minutes before your scheduled slot with your College ID card, formal attire, and 2 updated printed resumes.',
    sendEmail: true,
    customSubject: '',
    customMessage: '',
  });

  // Modal: Mark as Finally Selected (Company Offer + Placement + Mail)
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [selectingFinal, setSelectingFinal] = useState(false);
  const [finalForm, setFinalForm] = useState({
    role: drive?.role || '',
    package: drive?.package || '',
    placementDate: new Date().toISOString().slice(0, 10),
    sendEmail: true,
    customSubject: '',
    customMessage: '',
  });

  // Modal: Add Custom Round
  const [showAddRoundModal, setShowAddRoundModal] = useState(false);
  const [addingRound, setAddingRound] = useState(false);
  const [newRoundForm, setNewRoundForm] = useState({
    roundNumber: 2,
    name: '',
    type: 'Technical Interview',
    scheduledDate: '',
    venue: 'College Campus / Online',
    instructions: '',
  });

  // Fetch Candidates & Rounds
  const loadDriveDetails = () => {
    if (!drive?._id) return;
    setLoading(true);

    getDriveCandidates(drive._id)
      .then((res) => {
        const d = res.data.drive || drive;
        const rList = res.data.rounds || d.rounds || [];
        const fList = res.data.finalSelectedStudents || d.finalSelectedStudents || [];
        const regList = res.data.registeredStudents || d.registeredStudents || [];
        const eligList = res.data.eligibleStudents || [];
        const cRoundNum = res.data.currentRound || d.currentRound || 1;

        setDriveData(d);
        setRounds(rList);
        setCurrentRoundNumber(cRoundNum);
        setSelectedRoundNumber((prev) => (rList.some((r) => r.roundNumber === prev) ? prev : cRoundNum));
        setFinalSelectedStudents(fList);
        setRegisteredStudents(regList);
        setEligibleStudents(eligList);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load drive candidates');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDriveDetails();
  }, [drive?._id]);

  // Lookup map of all registered student objects by ID
  const studentMap = useMemo(() => {
    const map = new Map();
    registeredStudents.forEach((s) => {
      if (s && s._id) map.set(s._id.toString(), s);
    });
    eligibleStudents.forEach((s) => {
      if (s && s._id && !map.has(s._id.toString())) map.set(s._id.toString(), s);
    });
    return map;
  }, [registeredStudents, eligibleStudents]);

  // Active round object
  const activeRound = useMemo(() => {
    return rounds.find((r) => r.roundNumber === selectedRoundNumber) || rounds[0] || null;
  }, [rounds, selectedRoundNumber]);

  // Candidates for active round normalized with student details
  const activeRoundCandidates = useMemo(() => {
    if (!activeRound) return [];
    return (activeRound.candidates || []).map((cand) => {
      let student = cand.studentId;
      if (!student || typeof student === 'string' || !student.name) {
        const sid = (cand.studentId?._id || cand.studentId || '').toString();
        student = studentMap.get(sid) || { _id: sid, name: 'Student (' + sid.slice(-5) + ')', email: '' };
      }
      return {
        ...cand,
        student,
      };
    });
  }, [activeRound, studentMap]);

  // Filtered candidates in the active round by search query
  const filteredRoundCandidates = useMemo(() => {
    if (!roundSearchQuery) return activeRoundCandidates;
    const q = roundSearchQuery.toLowerCase();
    return activeRoundCandidates.filter((item) => {
      const s = item.student;
      return (
        s?.name?.toLowerCase().includes(q) ||
        s?.rollNumber?.toLowerCase().includes(q) ||
        s?.department?.toLowerCase().includes(q) ||
        s?.email?.toLowerCase().includes(q)
      );
    });
  }, [activeRoundCandidates, roundSearchQuery]);

  // Set of applied student IDs for fast lookup in eligible tab
  const appliedIds = useMemo(() => {
    return new Set(registeredStudents.map((s) => (s._id || s).toString()));
  }, [registeredStudents]);

  // Filter registered students by search query
  const filteredRegistered = useMemo(() => {
    if (!searchQuery) return registeredStudents;
    const q = searchQuery.toLowerCase();
    return registeredStudents.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [registeredStudents, searchQuery]);

  // Filter eligible students
  const filteredEligible = useMemo(() => {
    let list = eligibleStudents;
    if (eligibleFilter === 'applied') {
      list = list.filter((s) => appliedIds.has((s._id || s).toString()));
    } else if (eligibleFilter === 'not_applied') {
      list = list.filter((s) => !appliedIds.has((s._id || s).toString()));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.rollNumber?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [eligibleStudents, appliedIds, eligibleFilter, searchQuery]);

  // Selection Checkbox Helpers
  const handleToggleSelectStudent = (studentId) => {
    const sIdStr = studentId.toString();
    setSelectedStudentIds((prev) =>
      prev.includes(sIdStr) ? prev.filter((id) => id !== sIdStr) : [...prev, sIdStr]
    );
  };

  const handleSelectAllInRound = () => {
    const visibleIds = filteredRoundCandidates
      .map((c) => (c.student?._id || c.studentId?._id || c.studentId)?.toString())
      .filter(Boolean);

    const allSelected = visibleIds.every((id) => selectedStudentIds.includes(id));
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Resend Email for a single student in current round
  const handleResendSingle = async (studentId, studentName) => {
    setResendingId(studentId);
    try {
      const res = await resendRoundEmail(driveData._id, selectedRoundNumber, {
        studentIds: [studentId],
      });
      if (res.data.success) {
        toast.success(res.data.message || `Invitation email delivered to ${studentName}!`);
      } else {
        toast(res.data.message || 'Notification recorded for candidate.', { icon: 'ℹ️' });
      }
      loadDriveDetails();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend email';
      toast.error(msg);
    } finally {
      setResendingId(null);
    }
  };

  // Bulk Resend Email for selected students in current round
  const handleBulkResend = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Select at least one candidate to resend email');
      return;
    }

    setResendingId('bulk');
    try {
      const res = await resendRoundEmail(driveData._id, selectedRoundNumber, {
        studentIds: selectedStudentIds,
      });
      if (res.data.success) {
        toast.success(res.data.message || `Successfully delivered invitations to ${selectedStudentIds.length} candidate(s)!`);
      } else {
        toast(res.data.message || 'Notifications recorded.', { icon: 'ℹ️' });
      }
      setSelectedStudentIds([]);
      loadDriveDetails();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend emails';
      toast.error(msg);
    } finally {
      setResendingId(null);
    }
  };

  // Resend Placement Offer Email
  const handleResendOffer = async (studentId, studentName) => {
    setResendingId(studentId);
    try {
      const res = await resendOfferEmail(driveData._id, {
        studentIds: [studentId],
      });
      if (res.data.success) {
        toast.success(res.data.message || `Offer congratulations email delivered to ${studentName}!`);
      } else {
        toast(res.data.message || 'Offer notification recorded.', { icon: 'ℹ️' });
      }
      loadDriveDetails();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend offer email';
      toast.error(msg);
    } finally {
      setResendingId(null);
    }
  };

  // Open "Advance to Next Round" modal
  const handleOpenAdvanceModal = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student to advance to the next round');
      return;
    }

    const nextRNum = selectedRoundNumber + 1;
    const existingNextRound = rounds.find((r) => r.roundNumber === nextRNum);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    const defaultTitle =
      existingNextRound?.name ||
      (nextRNum === 2
        ? 'Round 2: Technical Interview'
        : nextRNum === 3
        ? 'Round 3: HR Interview'
        : `Round ${nextRNum}: Advanced Interview`);

    setAdvanceForm({
      nextRoundNumber: nextRNum,
      nextRoundName: defaultTitle,
      scheduledDate: existingNextRound?.scheduledDate
        ? new Date(new Date(existingNextRound.scheduledDate).getTime() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        : tomorrowIso,
      venue: existingNextRound?.venue || driveData.jobLocation || 'College CS Lab 3 / Online (Google Meet)',
      instructions:
        existingNextRound?.instructions ||
        'Please report 15 minutes before your scheduled slot with your College ID card, formal attire, and 2 updated printed resumes.',
      sendEmail: true,
      customSubject: `Congratulations! Shortlisted for ${defaultTitle} - ${driveData.companyName} Recruitment`,
      customMessage: '',
    });

    setShowAdvanceModal(true);
  };

  // Execute Round Advancement + Send Mail
  const handleConfirmAdvance = async (e) => {
    e.preventDefault();
    if (!advanceForm.nextRoundName.trim()) {
      toast.error('Please enter a name for the next round');
      return;
    }

    setAdvancing(true);
    try {
      const payload = {
        selectedStudentIds,
        nextRoundNumber: Number(advanceForm.nextRoundNumber),
        nextRoundName: advanceForm.nextRoundName.trim(),
        scheduledDate: advanceForm.scheduledDate ? new Date(advanceForm.scheduledDate).toISOString() : null,
        venue: advanceForm.venue.trim(),
        instructions: advanceForm.instructions.trim(),
        sendEmail: advanceForm.sendEmail,
        customSubject: advanceForm.customSubject.trim() || undefined,
        customMessage: advanceForm.customMessage.trim() || undefined,
      };

      const res = await advanceRoundCandidates(driveData._id, selectedRoundNumber, payload);
      toast.success(res.data.message || 'Candidates advanced successfully!');

      setShowAdvanceModal(false);
      setSelectedStudentIds([]);
      setSelectedRoundNumber(Number(advanceForm.nextRoundNumber));
      loadDriveDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to advance candidates');
    } finally {
      setAdvancing(false);
    }
  };

  // Open "Mark as Finally Selected" modal
  const handleOpenFinalModal = () => {
    if (selectedStudentIds.length === 0) {
      toast.error('Please select at least one student to mark as Finally Selected');
      return;
    }

    setFinalForm({
      role: driveData.role || '',
      package: driveData.package || '',
      placementDate: new Date().toISOString().slice(0, 10),
      sendEmail: true,
      customSubject: `🎉 Congratulations! Placement Offer from ${driveData.companyName}`,
      customMessage: '',
    });

    setShowFinalModal(true);
  };

  // Execute Final Placement Selection
  const handleConfirmFinalSelection = async (e) => {
    e.preventDefault();
    setSelectingFinal(true);
    try {
      const payload = {
        selectedStudentIds,
        currentRoundNumber: selectedRoundNumber,
        role: finalForm.role.trim() || driveData.role,
        package: Number(finalForm.package) || driveData.package,
        placementDate: finalForm.placementDate ? new Date(finalForm.placementDate).toISOString() : new Date().toISOString(),
        sendEmail: finalForm.sendEmail,
        customSubject: finalForm.customSubject.trim() || undefined,
        customMessage: finalForm.customMessage.trim() || undefined,
      };

      const res = await selectFinalCandidates(driveData._id, payload);
      toast.success(res.data.message || 'Selected candidates marked as placed successfully!');

      setShowFinalModal(false);
      setSelectedStudentIds([]);
      setActiveTab('placed');
      loadDriveDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record final placements');
    } finally {
      setSelectingFinal(false);
    }
  };

  // Add Custom Round
  const handleAddRound = async (e) => {
    e.preventDefault();
    if (!newRoundForm.name.trim()) {
      toast.error('Please enter round title');
      return;
    }

    setAddingRound(true);
    try {
      const nextRNum = rounds.length + 1;
      await addOrUpdateRound(driveData._id, {
        roundNumber: nextRNum,
        name: newRoundForm.name.trim(),
        type: newRoundForm.type,
        scheduledDate: newRoundForm.scheduledDate ? new Date(newRoundForm.scheduledDate).toISOString() : null,
        venue: newRoundForm.venue.trim() || 'Campus Lab / Online',
        instructions: newRoundForm.instructions.trim(),
        status: 'Upcoming',
      });

      toast.success(`Round ${nextRNum} added successfully!`);
      setShowAddRoundModal(false);
      setNewRoundForm({
        roundNumber: rounds.length + 2,
        name: '',
        type: 'Technical Interview',
        scheduledDate: '',
        venue: 'College Campus / Online',
        instructions: '',
      });
      loadDriveDetails();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add round');
    } finally {
      setAddingRound(false);
    }
  };

  // Export Round Candidates to Excel
  const handleExportRound = () => {
    if (activeRoundCandidates.length === 0) {
      toast.error('No candidates in this round to export');
      return;
    }

    const rows = activeRoundCandidates.map((item, idx) => ({
      'S.No': idx + 1,
      'Roll Number': item.student?.rollNumber || '-',
      'Student Name': item.student?.name || '-',
      Department: item.student?.department || '-',
      Batch: item.student?.batch || '-',
      CGPA: item.student?.cgpa || 0,
      'Live Arrears': item.student?.currentArrears ?? 0,
      'Round Status':
        item.status === 'shortlisted'
          ? `Shortlisted for Round ${selectedRoundNumber + 1}`
          : item.status === 'selected'
          ? 'Selected / Placed'
          : item.status === 'eliminated'
          ? 'Eliminated'
          : 'Pending',
      'Email Sent': item.emailSent ? 'Yes' : 'No',
      Phone: item.student?.phone || '-',
      Email: item.student?.email || '-',
      'Resume URL': item.student?.resumeUrl || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Round_${selectedRoundNumber}`);
    const filename = `${driveData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Round_${selectedRoundNumber}_Candidates.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success(`Exported ${activeRoundCandidates.length} round candidates to Excel!`);
  };

  // Export Placed Candidates to Excel
  const handleExportPlaced = () => {
    if (finalSelectedStudents.length === 0) {
      toast.error('No placed students to export');
      return;
    }

    const rows = finalSelectedStudents.map((item, idx) => {
      const s = item.studentId || {};
      return {
        'S.No': idx + 1,
        'Roll Number': s.rollNumber || '-',
        'Student Name': s.name || '-',
        Department: s.department || '-',
        Batch: s.batch || '-',
        Company: driveData.companyName,
        Role: item.role || driveData.role,
        'Package (LPA)': item.package || driveData.package,
        'Placed Date': item.placementDate
          ? new Date(item.placementDate).toLocaleDateString('en-IN')
          : '-',
        'Email Sent': item.emailSent ? 'Yes' : 'No',
        Phone: s.phone || '-',
        Email: s.email || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Final Selected');
    const filename = `${driveData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Final_Placed_Students.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success(`Exported ${finalSelectedStudents.length} placed candidates to Excel!`);
  };

  // Export Registered Candidates to Excel
  const handleExportRegistered = () => {
    if (registeredStudents.length === 0) {
      toast.error('No registered students to export');
      return;
    }

    const rows = registeredStudents.map((s, idx) => ({
      'S.No': idx + 1,
      'Roll Number': s.rollNumber,
      'Student Name': s.name,
      Department: s.department,
      Batch: s.batch,
      CGPA: s.cgpa || 0,
      'Live Arrears': s.currentArrears || 0,
      'History of Arrears': s.historyOfArrears || 0,
      '10th %': s.tenthPercentage ? `${s.tenthPercentage}%` : '-',
      '12th %': s.twelfthPercentage ? `${s.twelfthPercentage}%` : '-',
      'Career Goal': s.careerPreference || 'Placement',
      Email: s.email,
      Phone: s.phone || '-',
      'Resume URL': s.resumeUrl || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registered Candidates');
    const filename = `${driveData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Registered_Candidates.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success(`Exported ${registeredStudents.length} registered candidates to Excel!`);
  };

  // Export Eligible Candidates to Excel
  const handleExportEligible = () => {
    if (eligibleStudents.length === 0) {
      toast.error('No eligible students to export');
      return;
    }

    const rows = eligibleStudents.map((s, idx) => ({
      'S.No': idx + 1,
      'Roll Number': s.rollNumber,
      'Student Name': s.name,
      Department: s.department,
      Batch: s.batch,
      CGPA: s.cgpa || 0,
      'Live Arrears': s.currentArrears || 0,
      'Applied Status': appliedIds.has((s._id || s).toString()) ? 'Applied' : 'Not Yet Applied',
      'Career Goal': s.careerPreference || 'Placement',
      Email: s.email,
      Phone: s.phone || '-',
      'Resume URL': s.resumeUrl || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Eligible Candidates');
    const filename = `${driveData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Eligible_Candidates.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success(`Exported ${eligibleStudents.length} eligible candidates to Excel!`);
  };

  const modalContent = (
    <div
      className="form-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="form-modal"
        style={{
          maxWidth: '1420px',
          width: '98%',
          height: 'calc(100vh - 40px)',
          maxHeight: '940px',
          minHeight: '560px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '18px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          background: 'var(--bg-card, #ffffff)',
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
              }}
            >
              {driveData.companyName ? driveData.companyName.charAt(0).toUpperCase() : 'C'}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {driveData.companyName}
                </h2>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}
                >
                  ₹{driveData.package} LPA
                </span>
                <span
                  style={{
                    background:
                      driveData.status === 'Ongoing'
                        ? 'rgba(16, 185, 129, 0.2)'
                        : driveData.status === 'Completed'
                        ? 'rgba(148, 163, 184, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)',
                    color:
                      driveData.status === 'Ongoing'
                        ? '#34d399'
                        : driveData.status === 'Completed'
                        ? '#94a3b8'
                        : '#fbbf24',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '2px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                  }}
                >
                  {driveData.status}
                </span>

                {finalSelectedStudents.length > 0 && (
                  <span
                    style={{
                      background: 'rgba(234, 179, 8, 0.25)',
                      color: '#facc15',
                      border: '1px solid rgba(234, 179, 8, 0.4)',
                      padding: '2px 10px',
                      borderRadius: '20px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    🏆 {finalSelectedStudents.length} Placed
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                Role: <strong style={{ color: '#e2e8f0' }}>{driveData.role}</strong> • Drive Date:{' '}
                <strong style={{ color: '#e2e8f0' }}>
                  {new Date(driveData.driveDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                fontSize: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Close"
            >
              <HiOutlineX />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 24px 0',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--bg-card, #ffffff)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setActiveTab('pipeline');
                setSelectedStudentIds([]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'pipeline' ? '3px solid #2563eb' : '3px solid transparent',
                color: activeTab === 'pipeline' ? '#2563eb' : 'var(--text-muted, #64748b)',
                fontWeight: activeTab === 'pipeline' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
              id="tab-recruitment-pipeline"
            >
              <HiOutlineBriefcase style={{ fontSize: '1.15rem' }} />
              <span>Rounds & Shortlisting</span>
              <span
                style={{
                  background: activeTab === 'pipeline' ? '#2563eb' : 'var(--bg-input, #e2e8f0)',
                  color: activeTab === 'pipeline' ? '#fff' : 'var(--text-primary, #0f172a)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {rounds.length} Rounds
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('placed');
                setSelectedStudentIds([]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'placed' ? '3px solid #eab308' : '3px solid transparent',
                color: activeTab === 'placed' ? '#b45309' : 'var(--text-muted, #64748b)',
                fontWeight: activeTab === 'placed' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
              id="tab-final-placed"
            >
              <HiOutlineSparkles style={{ fontSize: '1.15rem', color: '#eab308' }} />
              <span>Final Placed</span>
              <span
                style={{
                  background: activeTab === 'placed' ? '#eab308' : 'var(--bg-input, #e2e8f0)',
                  color: activeTab === 'placed' ? '#000' : 'var(--text-primary, #0f172a)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {finalSelectedStudents.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('registered');
                setSearchQuery('');
                setSelectedStudentIds([]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'registered' ? '3px solid #6366f1' : '3px solid transparent',
                color: activeTab === 'registered' ? '#4f46e5' : 'var(--text-muted, #64748b)',
                fontWeight: activeTab === 'registered' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
              id="tab-registered-candidates"
            >
              <HiOutlineUserGroup style={{ fontSize: '1.15rem' }} /> Registered ({registeredStudents.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('eligible');
                setSearchQuery('');
                setSelectedStudentIds([]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'eligible' ? '3px solid #10b981' : '3px solid transparent',
                color: activeTab === 'eligible' ? '#059669' : 'var(--text-muted, #64748b)',
                fontWeight: activeTab === 'eligible' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
              id="tab-eligible-candidates"
            >
              <HiOutlineAcademicCap style={{ fontSize: '1.15rem' }} /> All Eligible ({eligibleStudents.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('info');
                setSelectedStudentIds([]);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'info' ? '3px solid #8b5cf6' : '3px solid transparent',
                color: activeTab === 'info' ? '#7c3aed' : 'var(--text-muted, #64748b)',
                fontWeight: activeTab === 'info' ? 700 : 500,
                fontSize: '0.92rem',
                cursor: 'pointer',
              }}
              id="tab-drive-info"
            >
              <HiOutlineDocumentText style={{ fontSize: '1.15rem' }} /> Requirements & Process
            </button>
          </div>

          {/* Quick Export on Right */}
          <div style={{ display: 'flex', gap: '8px', paddingBottom: '6px' }}>
            {activeTab === 'pipeline' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleExportRound}
                disabled={activeRoundCandidates.length === 0}
              >
                <HiOutlineDownload /> Export Round {selectedRoundNumber} ({activeRoundCandidates.length})
              </button>
            )}

            {activeTab === 'placed' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleExportPlaced}
                disabled={finalSelectedStudents.length === 0}
              >
                <HiOutlineDownload /> Export Placed ({finalSelectedStudents.length})
              </button>
            )}

            {activeTab === 'registered' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleExportRegistered}
                disabled={registeredStudents.length === 0}
              >
                <HiOutlineDownload /> Export Excel ({registeredStudents.length})
              </button>
            )}

            {activeTab === 'eligible' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleExportEligible}
                disabled={eligibleStudents.length === 0}
              >
                <HiOutlineDownload /> Export All Eligible ({eligibleStudents.length})
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '18px 24px', background: 'var(--bg-page, #f8fafc)' }}>

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Loader />
              <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Loading recruitment pipeline and candidate details...
              </p>
            </div>
          ) : activeTab === 'pipeline' ? (
            /* ============================================================
               TAB: RECRUITMENT ROUNDS PIPELINE (Round 1, 2, ... N)
               ============================================================ */
            <div>
              {/* Horizontal Round Stepper / Pills Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  overflowX: 'auto',
                  padding: '4px 2px 14px',
                  borderBottom: '1px solid var(--border-color, #e2e8f0)',
                  marginBottom: '16px',
                }}
              >
                {rounds.map((round) => {
                  const isSelected = round.roundNumber === selectedRoundNumber;
                  const candCount = (round.candidates || []).length;
                  const shortlistedCount = (round.candidates || []).filter((c) => c.status === 'shortlisted').length;

                  return (
                    <button
                      key={round.roundNumber}
                      type="button"
                      onClick={() => {
                        setSelectedRoundNumber(round.roundNumber);
                        setSelectedStudentIds([]);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 16px',
                        borderRadius: '12px',
                        flexShrink: 0,
                        border: isSelected ? '2px solid #2563eb' : '1px solid var(--border-color, #cbd5e1)',
                        background: isSelected
                          ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.02) 100%)'
                          : 'var(--bg-card, #ffffff)',
                        color: isSelected ? '#1d4ed8' : 'var(--text-primary, #0f172a)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: isSelected ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isSelected ? '#2563eb' : 'var(--bg-input, #e2e8f0)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted, #64748b)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '0.85rem',
                        }}
                      >
                        {round.roundNumber}
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                          {round.name || `Round ${round.roundNumber}`}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                          {candCount} Candidates {shortlistedCount > 0 ? `(${shortlistedCount} advanced)` : ''}
                        </div>
                      </div>

                      {round.status === 'Completed' ? (
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          ✓ Done
                        </span>
                      ) : (
                        <span
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* + Add Round Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = rounds.length + 1;
                    setNewRoundForm({
                      roundNumber: nextNum,
                      name: `Round ${nextNum}: Technical Interview`,
                      type: 'Technical Interview',
                      scheduledDate: '',
                      venue: driveData.jobLocation || 'College Campus / Online',
                      instructions: '',
                    });
                    setShowAddRoundModal(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    flexShrink: 0,
                    border: '1px dashed #94a3b8',
                    background: 'transparent',
                    color: '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                  title="Add another recruitment round"
                >
                  <HiOutlinePlus style={{ fontSize: '1.1rem' }} /> Add Round {rounds.length + 1}
                </button>
              </div>

              {/* Current Active Round Details Card */}
              {activeRound && (
                <div
                  style={{
                    background: 'var(--bg-card, #ffffff)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    marginBottom: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                          {activeRound.name}
                        </h3>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background:
                              activeRound.status === 'Completed'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(59, 130, 246, 0.15)',
                            color: activeRound.status === 'Completed' ? '#059669' : '#2563eb',
                          }}
                        >
                          Status: {activeRound.status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '20px',
                          marginTop: '8px',
                          fontSize: '0.84rem',
                          color: 'var(--text-secondary, #475569)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HiOutlineCalendar style={{ color: '#2563eb' }} />
                          <span>
                            Scheduled:{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {activeRound.scheduledDate
                                ? new Date(activeRound.scheduledDate).toLocaleString('en-IN', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })
                                : 'Not Scheduled Yet'}
                            </strong>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HiOutlineLocationMarker style={{ color: '#ef4444' }} />
                          <span>
                            Venue:{' '}
                            <strong style={{ color: 'var(--text-primary)' }}>
                              {activeRound.venue || 'College Lab / Online'}
                            </strong>
                          </span>
                        </div>

                        {activeRound.instructions && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <HiOutlineDocumentText style={{ color: '#f59e0b' }} />
                            <span>
                              Instructions: <em>{activeRound.instructions}</em>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats Badges */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '6px 14px',
                          background: 'var(--bg-secondary, #f8fafc)',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color, #e2e8f0)',
                        }}
                      >
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          {activeRoundCandidates.length}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>CANDIDATES</div>
                      </div>

                      <div
                        style={{
                          textAlign: 'center',
                          padding: '6px 14px',
                          background: 'rgba(16, 185, 129, 0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}
                      >
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                          {activeRoundCandidates.filter((c) => c.status === 'shortlisted').length}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>ADVANCED</div>
                      </div>

                      <div
                        style={{
                          textAlign: 'center',
                          padding: '6px 14px',
                          background: 'rgba(234, 179, 8, 0.1)',
                          borderRadius: '8px',
                          border: '1px solid rgba(234, 179, 8, 0.25)',
                        }}
                      >
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#b45309' }}>
                          {activeRoundCandidates.filter((c) => c.status === 'selected').length}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#b45309', fontWeight: 600 }}>PLACED</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Ribbon & Selection Summary Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: selectedStudentIds.length > 0 ? '#eff6ff' : 'var(--bg-card, #ffffff)',
                  border: selectedStudentIds.length > 0 ? '1px solid #93c5fd' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '12px 18px',
                  marginBottom: '14px',
                  flexWrap: 'wrap',
                  gap: '12px',
                  transition: 'all 0.2s',
                }}
              >
                {/* Search in Current Round */}
                <div className="search-bar" style={{ flex: '1', maxWidth: '320px' }}>
                  <HiOutlineSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder={`Search Round ${selectedRoundNumber} candidates...`}
                    value={roundSearchQuery}
                    onChange={(e) => setRoundSearchQuery(e.target.value)}
                  />
                </div>

                {/* Candidate Selection Count & Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedStudentIds.length > 0 ? (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          color: '#1d4ed8',
                        }}
                      >
                        <HiOutlineCheckCircle style={{ fontSize: '1.2rem' }} />
                        <span>{selectedStudentIds.length} selected</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        Clear
                      </button>

                      {/* Bulk Resend Email */}
                      <button
                        type="button"
                        onClick={handleBulkResend}
                        disabled={resendingId === 'bulk'}
                        className="btn btn-secondary"
                        style={{
                          padding: '7px 14px',
                          fontSize: '0.82rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          borderColor: '#3b82f6',
                          color: '#1d4ed8',
                        }}
                        title="Resend invitation emails to all selected candidates"
                      >
                        <HiOutlineRefresh className={resendingId === 'bulk' ? 'spin' : ''} />
                        {resendingId === 'bulk' ? 'Resending...' : `Resend Email (${selectedStudentIds.length})`}
                      </button>

                      {/* Primary Button: Advance to Next Round & Send Mail */}
                      <button
                        type="button"
                        onClick={handleOpenAdvanceModal}
                        className="btn btn-primary"
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        }}
                      >
                        <HiOutlineArrowRight /> Advance to Round {selectedRoundNumber + 1} & Send Mail ({selectedStudentIds.length})
                      </button>

                      {/* Final Placement Offer Button */}
                      <button
                        type="button"
                        onClick={handleOpenFinalModal}
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          color: '#ffffff',
                          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                        }}
                      >
                        <HiOutlineSparkles /> Mark as Placed ({selectedStudentIds.length})
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted, #64748b)' }}>
                      💡 <em>Check boxes next to students to advance them, resend emails, or mark as placed.</em>
                    </div>
                  )}
                </div>
              </div>

              {/* Table of Candidates for Active Round */}
              {filteredRoundCandidates.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'var(--bg-card, #fff)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-color, #cbd5e1)',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      margin: '0 auto 14px',
                    }}
                  >
                    <HiOutlineUserGroup />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>
                    {selectedRoundNumber === 1
                      ? 'No Candidates in Round 1'
                      : `No Candidates in Round ${selectedRoundNumber} Yet`}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
                    {selectedRoundNumber === 1
                      ? 'Students who register for this drive will automatically appear here in Round 1.'
                      : `Select candidates from Round ${selectedRoundNumber - 1} and click 'Advance to Round ${selectedRoundNumber}' to shortlist them for this stage.`}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-card, #fff)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.85rem', margin: 0, minWidth: '950px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                              checked={
                                filteredRoundCandidates.length > 0 &&
                                filteredRoundCandidates.every((c) =>
                                  selectedStudentIds.includes(
                                    (c.student?._id || c.studentId?._id || c.studentId)?.toString()
                                  )
                                )
                              }
                              onChange={handleSelectAllInRound}
                              title="Select / Deselect all in this round"
                            />
                          </th>
                          <th style={{ width: '40px' }}>#</th>
                          <th>Student Name</th>
                          <th>Roll No</th>
                          <th>Dept</th>
                          <th>CGPA</th>
                          <th>Live Arrears</th>
                          <th>Round Status</th>
                          <th style={{ minWidth: '150px' }}>Email Notification</th>
                          <th>Contact Email & Phone</th>
                          <th>Resume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoundCandidates.map((cand, idx) => {
                          const student = cand.student || {};
                          const sIdStr = (student._id || cand.studentId?._id || cand.studentId)?.toString();
                          const isSelected = selectedStudentIds.includes(sIdStr);

                          return (
                            <tr
                              key={sIdStr || idx}
                              style={{
                                background: isSelected ? 'rgba(37, 99, 235, 0.05)' : undefined,
                              }}
                            >
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectStudent(sIdStr)}
                                />
                              </td>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{idx + 1}</td>
                              <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                {student.name || 'Unknown Student'}
                              </td>
                              <td>
                                <code style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                  {student.rollNumber || '-'}
                                </code>
                              </td>
                              <td>
                                <span className="badge badge-info">{student.department || '-'}</span>
                              </td>
                              <td style={{ fontWeight: 700, color: student.cgpa >= 8.0 ? '#10b981' : 'inherit' }}>
                                {student.cgpa || '-'}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    Number(student.currentArrears) > 0 ? 'badge-warning' : 'badge-neutral'
                                  }`}
                                >
                                  {student.currentArrears ?? 0}
                                </span>
                              </td>
                              <td>
                                {cand.status === 'shortlisted' ? (
                                  <span
                                    style={{
                                      background: '#dcfce7',
                                      color: '#15803d',
                                      border: '1px solid #86efac',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    ✓ Qualified Round {selectedRoundNumber}
                                  </span>
                                ) : cand.status === 'selected' ? (
                                  <span
                                    style={{
                                      background: '#fef08a',
                                      color: '#854d0e',
                                      border: '1px solid #fde047',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.74rem',
                                      fontWeight: 800,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    🏆 Placed / Offered
                                  </span>
                                ) : cand.status === 'eliminated' ? (
                                  <span
                                    style={{
                                      background: '#f1f5f9',
                                      color: '#64748b',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Eliminated
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      background: '#fef3c7',
                                      color: '#b45309',
                                      padding: '3px 8px',
                                      borderRadius: '12px',
                                      fontSize: '0.74rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Pending Review
                                  </span>
                                )}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {cand.emailSent ? (
                                    <span
                                      style={{
                                        color: '#059669',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                      }}
                                      title={cand.emailSentAt ? `Sent on ${new Date(cand.emailSentAt).toLocaleString()}` : 'Email sent'}
                                    >
                                      <HiOutlineMail /> Sent
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Not Sent</span>
                                  )}

                                  {/* Resend Email Button */}
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '3px 8px',
                                      fontSize: '0.72rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      borderRadius: '6px',
                                    }}
                                    title={`Resend Round ${selectedRoundNumber} invitation email to ${student.name}`}
                                    onClick={() => handleResendSingle(sIdStr, student.name, student.email)}
                                    disabled={resendingId === sIdStr}
                                  >
                                    <HiOutlineRefresh className={resendingId === sIdStr ? 'spin' : ''} />
                                    {resendingId === sIdStr ? 'Sending...' : 'Resend'}
                                  </button>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.78rem' }}>
                                  {student.email && (
                                    <a
                                      href={`mailto:${student.email}`}
                                      style={{ color: '#2563eb', textDecoration: 'none', display: 'block', fontWeight: 600 }}
                                    >
                                      {student.email}
                                    </a>
                                  )}
                                  {student.phone && (
                                    <span style={{ color: 'var(--text-muted)' }}>{student.phone}</span>
                                  )}
                                </div>
                              </td>
                              <td>
                                {student.resumeUrl ? (
                                  <a
                                    href={student.resumeUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary"
                                    style={{ padding: '2px 8px', fontSize: '0.72rem', textDecoration: 'none' }}
                                  >
                                    Resume ↗
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'placed' ? (
            /* ============================================================
               TAB: FINAL PLACED STUDENTS
               ============================================================ */
            <div>
              <div
                style={{
                  background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                  color: '#ffffff',
                  padding: '20px 24px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 4px 14px rgba(4, 120, 87, 0.25)',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: 800, color: '#fef08a' }}>
                    🏆 Final Selected Candidates ({finalSelectedStudents.length})
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.9 }}>
                    These students have successfully cleared all recruitment rounds and have been offered positions at{' '}
                    <strong>{driveData.companyName}</strong> with ₹{driveData.package} LPA CTC!
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleExportPlaced}
                  disabled={finalSelectedStudents.length === 0}
                  style={{
                    background: '#ffffff',
                    color: '#065f46',
                    border: 'none',
                    fontWeight: 700,
                    padding: '8px 16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <HiOutlineDownload /> Export Placed Candidates Excel
                </button>
              </div>

              {finalSelectedStudents.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: 'var(--bg-card, #fff)',
                    borderRadius: '12px',
                    border: '1px dashed var(--border-color, #cbd5e1)',
                  }}
                >
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'rgba(234, 179, 8, 0.15)',
                      color: '#b45309',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      margin: '0 auto 14px',
                    }}
                  >
                    <HiOutlineSparkles />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>
                    No Final Selections Recorded Yet
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto' }}>
                    Go to the <strong>Rounds & Shortlisting</strong> tab, select candidates who cleared the final round,
                    and click <strong>&apos;Mark as Finally Selected / Placed&apos;</strong> to generate placement records and send offer congratulations emails.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-card, #fff)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table" style={{ fontSize: '0.85rem', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Roll No</th>
                          <th>Department</th>
                          <th>Batch</th>
                          <th>Offered Role</th>
                          <th>Package</th>
                          <th>Placed Date</th>
                          <th>Offer Mail Status</th>
                          <th>Contact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalSelectedStudents.map((item, idx) => {
                          const s = item.studentId || {};
                          const sId = (s._id || s).toString();
                          return (
                            <tr key={s._id || idx}>
                              <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{idx + 1}</td>
                              <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.name || '-'}</td>
                              <td>
                                <code style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.rollNumber || '-'}</code>
                              </td>
                              <td>
                                <span className="badge badge-info">{s.department || '-'}</span>
                              </td>
                              <td>{s.batch || '-'}</td>
                              <td style={{ fontWeight: 600 }}>{item.role || driveData.role}</td>
                              <td>
                                <span
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.12)',
                                    color: '#059669',
                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontWeight: 700,
                                  }}
                                >
                                  ₹{item.package || driveData.package} LPA
                                </span>
                              </td>
                              <td>
                                {item.placementDate
                                  ? new Date(item.placementDate).toLocaleDateString('en-IN')
                                  : '-'}
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {item.emailSent ? (
                                    <span
                                      style={{
                                        color: '#059669',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      <HiOutlineMail /> Sent
                                    </span>
                                  ) : (
                                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Not Sent</span>
                                  )}

                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{
                                      padding: '2px 8px',
                                      fontSize: '0.72rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      borderRadius: '6px',
                                    }}
                                    title={`Resend placement offer congratulation email to ${s.name}`}
                                    onClick={() => handleResendOffer(sId, s.name, s.email)}
                                    disabled={resendingId === sId}
                                  >
                                    <HiOutlineRefresh className={resendingId === sId ? 'spin' : ''} />
                                    {resendingId === sId ? 'Sending...' : 'Resend'}
                                  </button>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.78rem' }}>
                                  {s.email && <div>{s.email}</div>}
                                  {s.phone && <div style={{ color: 'var(--text-muted)' }}>{s.phone}</div>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'registered' ? (
            /* ============================================================
               TAB: REGISTERED CANDIDATES
               ============================================================ */
            filteredRegistered.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--bg-card, #fff)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color, #cbd5e1)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    margin: '0 auto 14px',
                  }}
                >
                  <HiOutlineUserGroup />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>
                  {searchQuery ? 'No matching registered students' : 'No Students Have Applied Yet'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto' }}>
                  {searchQuery
                    ? 'Try searching with a different student name, roll number, or department.'
                    : `Eligible students can apply directly from their Student Portal. Once they click 'Apply Now', they will appear in this list in real time.`}
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-card, #fff)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.85rem', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Roll No</th>
                        <th>Dept</th>
                        <th>CGPA</th>
                        <th>Live Arrears</th>
                        <th>Career Track</th>
                        <th>Phone</th>
                        <th>Email</th>
                        <th>Resume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistered.map((student, idx) => (
                        <tr key={student._id || idx}>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{idx + 1}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</td>
                          <td>
                            <code style={{ fontSize: '0.8rem', fontWeight: 600 }}>{student.rollNumber}</code>
                          </td>
                          <td>
                            <span className="badge badge-info">{student.department}</span>
                          </td>
                          <td style={{ fontWeight: 700, color: student.cgpa >= 8.0 ? '#10b981' : 'inherit' }}>
                            {student.cgpa}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                Number(student.currentArrears) > 0 ? 'badge-warning' : 'badge-neutral'
                              }`}
                            >
                              {student.currentArrears ?? 0}
                            </span>
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#059669',
                                border: '1px solid rgba(16, 185, 129, 0.25)',
                                fontSize: '0.75rem',
                              }}
                            >
                              💼 Placement
                            </span>
                          </td>
                          <td>{student.phone || '-'}</td>
                          <td>
                            {student.email ? (
                              <a
                                href={`mailto:${student.email}`}
                                style={{ color: '#2563eb', textDecoration: 'underline' }}
                              >
                                {student.email}
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            {student.resumeUrl ? (
                              <a
                                href={student.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '0.75rem', textDecoration: 'none' }}
                              >
                                Resume ↗
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>None</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : activeTab === 'eligible' ? (
            /* ============================================================
               TAB: ALL ELIGIBLE STUDENTS
               ============================================================ */
            filteredEligible.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  background: 'var(--bg-card, #fff)',
                  borderRadius: '12px',
                  border: '1px dashed var(--border-color, #cbd5e1)',
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    margin: '0 auto 14px',
                  }}
                >
                  <HiOutlineAcademicCap />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px' }}>
                  No Eligible Students Found
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto' }}>
                  No students in the college matched the criteria or search filter.
                </p>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--bg-card, #fff)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table" style={{ fontSize: '0.85rem', margin: 0 }}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Roll No</th>
                        <th>Dept</th>
                        <th>CGPA</th>
                        <th>Arrears</th>
                        <th>Application Status</th>
                        <th>Phone</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEligible.map((student, idx) => {
                        const hasApplied = appliedIds.has((student._id || student).toString());
                        return (
                          <tr key={student._id || idx}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{idx + 1}</td>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{student.name}</td>
                            <td>
                              <code style={{ fontSize: '0.8rem', fontWeight: 600 }}>{student.rollNumber}</code>
                            </td>
                            <td>
                              <span className="badge badge-info">{student.department}</span>
                            </td>
                            <td style={{ fontWeight: 700, color: student.cgpa >= 8.0 ? '#10b981' : 'inherit' }}>
                              {student.cgpa}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  Number(student.currentArrears) > 0 ? 'badge-warning' : 'badge-neutral'
                                }`}
                              >
                                {student.currentArrears ?? 0}
                              </span>
                            </td>
                            <td>
                              {hasApplied ? (
                                <span
                                  className="badge badge-success"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontWeight: 700,
                                  }}
                                >
                                  <HiOutlineCheckCircle /> Registered
                                </span>
                              ) : (
                                <span
                                  className="badge badge-neutral"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  Not Applied
                                </span>
                              )}
                            </td>
                            <td>{student.phone || '-'}</td>
                            <td>
                              {student.email ? (
                                <a
                                  href={`mailto:${student.email}`}
                                  style={{ color: '#2563eb', textDecoration: 'underline' }}
                                >
                                  {student.email}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* ============================================================
               TAB: DRIVE INFO & REQUIREMENTS
               ============================================================ */
            <div
              style={{
                background: 'var(--bg-card, #fff)',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid var(--border-color, #e2e8f0)',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Recruitment Drive Specifications
              </h3>

              <div className="detail-grid" style={{ marginBottom: '20px' }}>
                <div className="detail-field">
                  <span className="detail-label">Company Name</span>
                  <span className="detail-value">{driveData.companyName}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Designation / Role</span>
                  <span className="detail-value">{driveData.role}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">CTC Package</span>
                  <span className="detail-value">₹{driveData.package} LPA</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Job Location</span>
                  <span className="detail-value">{driveData.jobLocation || 'Pan India'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Drive Date</span>
                  <span className="detail-value">
                    {new Date(driveData.driveDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Registration Deadline</span>
                  <span className="detail-value">
                    {new Date(driveData.registrationDeadline).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Minimum CGPA Required</span>
                  <span className="detail-value">{driveData.minCgpa ?? 'No Bar'}</span>
                </div>
                <div className="detail-field">
                  <span className="detail-label">Maximum Live Arrears Permitted</span>
                  <span className="detail-value">{driveData.maxCurrentArrears ?? 0}</span>
                </div>
                <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Eligible Engineering Departments</span>
                  <span className="detail-value">
                    {driveData.eligibleDepartments?.map((d) => (
                      <span key={d} className="badge badge-info" style={{ marginRight: 6 }}>
                        {d}
                      </span>
                    ))}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>
                  Selection Process & Rounds:
                </h4>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary, #f8fafc)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                  }}
                >
                  {driveData.selectionProcess || 'Standard campus selection process'}
                </p>
              </div>

              {driveData.jobDescription && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>
                    Job Description & Role Requirements:
                  </h4>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      background: 'var(--bg-secondary, #f8fafc)',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color, #e2e8f0)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {driveData.jobDescription}
                  </p>
                </div>
              )}

              {driveData.applicationLink && (
                <div style={{ marginTop: '16px' }}>
                  <a
                    href={driveData.applicationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    External Registration Link <HiOutlineExternalLink />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--bg-card, #ffffff)',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Drive ID: <code style={{ fontSize: '0.75rem' }}>{driveData._id}</code>
          </div>

          <button type="button" className="btn btn-primary" onClick={onClose} style={{ padding: '8px 24px' }}>
            Done / Close
          </button>
        </div>
      </div>



      {/* ============================================================
          POPUP MODAL: ADVANCE CANDIDATES TO NEXT ROUND & SEND MAIL
          ============================================================ */}
      {showAdvanceModal && (
        <div
          className="form-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10001,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setShowAdvanceModal(false)}
        >
          <div
            className="form-modal"
            style={{ maxWidth: '640px', width: '92%', borderRadius: '16px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 22px',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  🚀 Advance to Round {advanceForm.nextRoundNumber} & Send Invitations
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                  Shortlisting {selectedStudentIds.length} candidate(s) from Round {selectedRoundNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanceModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleConfirmAdvance} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Round Title / Stage Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={advanceForm.nextRoundName}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, nextRoundName: e.target.value })}
                  placeholder="e.g. Round 2: Technical Interview"
                />
              </div>

              {/* WHEN IS THE 2ND ROUND / NEXT ROUND (Date & Time) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HiOutlineCalendar /> When is Round {advanceForm.nextRoundNumber} Scheduled? (Date & Time)
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  required
                  value={advanceForm.scheduledDate}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, scheduledDate: e.target.value })}
                  style={{ fontWeight: 600, fontSize: '0.95rem', borderColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  This date and time will be prominently highlighted in the student&apos;s email invitation.
                </span>
              </div>

              {/* Venue or Online Meeting Link */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Venue or Meeting Link
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={advanceForm.venue}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, venue: e.target.value })}
                  placeholder="e.g. CS Lab 3 / Google Meet link"
                />
              </div>

              {/* Special Instructions for Candidates */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Instructions for Candidates
                </label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={advanceForm.instructions}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, instructions: e.target.value })}
                  placeholder="e.g. Bring college ID, formal attire, and 2 updated resumes..."
                />
              </div>

              {/* Send Email Checkbox Option */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <input
                  type="checkbox"
                  id="send-round-mail"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                  checked={advanceForm.sendEmail}
                  onChange={(e) => setAdvanceForm({ ...advanceForm, sendEmail: e.target.checked })}
                />
                <label htmlFor="send-round-mail" style={{ fontSize: '0.86rem', fontWeight: 600, color: '#166534', cursor: 'pointer', margin: 0 }}>
                  ✉️ Send official shortlist email invitations to all {selectedStudentIds.length} candidate(s) now
                </label>
              </div>

              {/* Live Email Preview Box */}
              <div
                style={{
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px dashed var(--border-color, #cbd5e1)',
                  borderRadius: '10px',
                  padding: '14px',
                  fontSize: '0.8rem',
                }}
              >
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HiOutlineMail style={{ color: '#2563eb' }} /> Email Preview Summary:
                </div>
                <div style={{ color: '#475569', lineHeight: 1.5 }}>
                  <strong>Subject:</strong> {advanceForm.customSubject || `Congratulations! Shortlisted for ${advanceForm.nextRoundName || 'Next Round'}`}<br />
                  <strong>Round:</strong> {advanceForm.nextRoundName}<br />
                  <strong>Scheduled For:</strong>{' '}
                  <span style={{ color: '#059669', fontWeight: 700 }}>
                    {advanceForm.scheduledDate ? new Date(advanceForm.scheduledDate).toLocaleString('en-IN') : 'Not set'}
                  </span><br />
                  <strong>Venue:</strong> {advanceForm.venue}
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAdvanceModal(false)}
                  disabled={advancing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={advancing}
                  style={{
                    padding: '10px 22px',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {advancing ? 'Advancing & Sending Emails...' : `Confirm & Advance (${selectedStudentIds.length} Students)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          POPUP MODAL: MARK AS FINALLY SELECTED / PLACED & SEND OFFER
          ============================================================ */}
      {showFinalModal && (
        <div
          className="form-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10001,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setShowFinalModal(false)}
        >
          <div
            className="form-modal"
            style={{ maxWidth: '620px', width: '92%', borderRadius: '16px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#fef08a' }}>
                  🎉 Final Placement Selection & Offers
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.84rem', opacity: 0.9 }}>
                  Generating official placement records for {selectedStudentIds.length} candidate(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFinalModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleConfirmFinalSelection} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Selected Company
                </label>
                <input type="text" className="form-input" disabled value={driveData.companyName} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Designation / Role
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={finalForm.role}
                    onChange={(e) => setFinalForm({ ...finalForm, role: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    CTC Package (LPA)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    required
                    value={finalForm.package}
                    onChange={(e) => setFinalForm({ ...finalForm, package: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Offer / Placement Date
                </label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={finalForm.placementDate}
                  onChange={(e) => setFinalForm({ ...finalForm, placementDate: e.target.value })}
                />
              </div>

              {/* Send Offer Mail Checkbox */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <input
                  type="checkbox"
                  id="send-final-mail"
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#16a34a' }}
                  checked={finalForm.sendEmail}
                  onChange={(e) => setFinalForm({ ...finalForm, sendEmail: e.target.checked })}
                />
                <label htmlFor="send-final-mail" style={{ fontSize: '0.86rem', fontWeight: 600, color: '#166534', cursor: 'pointer', margin: 0 }}>
                  ✉️ Send official congratulatory placement offer email to all {selectedStudentIds.length} candidate(s)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowFinalModal(false)}
                  disabled={selectingFinal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={selectingFinal}
                  style={{
                    padding: '10px 22px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {selectingFinal
                    ? 'Recording Placements & Sending Emails...'
                    : `🎉 Confirm Placement Offers (${selectedStudentIds.length} Students)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          POPUP MODAL: ADD CUSTOM ROUND
          ============================================================ */}
      {showAddRoundModal && (
        <div
          className="form-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10001,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={() => setShowAddRoundModal(false)}
        >
          <div
            className="form-modal"
            style={{ maxWidth: '520px', width: '90%', borderRadius: '16px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '18px 22px',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                ➕ Configure Round {newRoundForm.roundNumber}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddRoundModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleAddRound} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Round Name / Stage Title
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={newRoundForm.name}
                  onChange={(e) => setNewRoundForm({ ...newRoundForm, name: e.target.value })}
                  placeholder={`Round ${newRoundForm.roundNumber}: Technical Interview`}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Scheduled Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newRoundForm.scheduledDate}
                  onChange={(e) => setNewRoundForm({ ...newRoundForm, scheduledDate: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Venue / Location
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newRoundForm.venue}
                  onChange={(e) => setNewRoundForm({ ...newRoundForm, venue: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddRoundModal(false)}
                  disabled={addingRound}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={addingRound}>
                  {addingRound ? 'Adding Round...' : 'Add Round'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};

export default CompanyDriveModal;
