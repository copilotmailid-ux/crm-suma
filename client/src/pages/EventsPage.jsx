import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineCalendar,
  HiOutlinePlus,
  HiOutlineUserGroup,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineDownload,
  HiOutlineDocumentText,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiOutlineOfficeBuilding,
  HiOutlineUserAdd,
  HiOutlineAcademicCap,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Loader from '../components/common/Loader';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addStudentToAttendance,
  updateAttendanceStatus,
  bulkUpdateAttendance,
  autoRegisterStudents,
  removeStudentFromAttendance,
} from '../api/eventApi';
import '../styles/events.css';

const ALL_DEPARTMENTS = ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'];
const ALL_BATCHES = ['2021-2025', '2022-2026', '2023-2027', '2024-2028'];
const EVENT_TYPES = [
  'Training',
  'Technical Training',
  'Aptitude Training',
  'Soft Skills Training',
  'Workshop',
  'Guest Lecture',
  'Bootcamp',
  'Seminar',
  'Mock Interview Drive',
  'Hackathon',
  'Webinar',
  'Orientation',
];

const initialFormState = {
  title: '',
  chiefGuest: '',
  chiefGuestDesignation: '',
  chiefGuestCompany: '',
  chiefGuestEmail: '',
  chiefGuestPhone: '',
  chiefGuestBio: '',
  chiefGuestLinkedin: '',
  prerequisites: '',
  registrationDeadline: '',
  eventDate: '',
  isMultiDay: false,
  endDate: '',
  durationDays: 1,
  scheduleType: 'Single Day',
  dailyTimingNote: '',
  startTime: '10:00 AM',
  endTime: '01:00 PM',
  venue: '',
  departments: ['CSE', 'IT', 'AIDS', 'AIML', 'ECE', 'EEE', 'ME', 'CE'],
  eligibleBatches: ['2022-2026'],
  eventType: 'Training',
  status: 'Upcoming',
  description: '',
  maxParticipants: 150,
  autoRegisterEligible: true,
};

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('all');

  // Event Modal (Create / Edit)
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [savingEvent, setSavingEvent] = useState(false);

  // Attendance Roster Modal
  const [activeEvent, setActiveEvent] = useState(null);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceDeptFilter, setAttendanceDeptFilter] = useState('ALL');
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState('all');

  // Manual Add Student to Attendance Form
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [newStudent, setNewStudent] = useState({
    studentName: '',
    rollNumber: '',
    department: 'CSE',
    batch: '2022-2026',
    status: 'Present',
  });

  // Delete Confirm Modal
  const [deleteEventId, setDeleteEventId] = useState(null);

  // Fetch all events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEvents({
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        department: deptFilter !== 'ALL' ? deptFilter : undefined,
        eventType: typeFilter !== 'all' ? typeFilter : undefined,
      });
      setEvents(res.data || []);

      // If active event is open, update its state too
      if (activeEvent) {
        const updated = res.data?.find((e) => e._id === activeEvent._id);
        if (updated) setActiveEvent(updated);
      }
    } catch {
      toast.error('Failed to load placement events');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, deptFilter, typeFilter, activeEvent]);

  useEffect(() => {
    fetchEvents();
  }, [search, statusFilter, deptFilter, typeFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => e.status === 'Upcoming').length;
    const ongoing = events.filter((e) => e.status === 'Ongoing').length;
    const completed = events.filter((e) => e.status === 'Completed').length;

    let totalRegistered = 0;
    let totalPresent = 0;

    events.forEach((e) => {
      if (e.attendance) {
        totalRegistered += e.attendance.length;
        totalPresent += e.attendance.filter((a) => a.status === 'Present').length;
      }
    });

    const rate = totalRegistered > 0 ? Math.round((totalPresent / totalRegistered) * 100) : 0;

    return { total, upcoming, ongoing, completed, totalRegistered, totalPresent, rate };
  }, [events]);

  // Handle Event Modal Open
  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setForm(initialFormState);
    setShowEventModal(true);
  };

  const handleOpenEditModal = (evt) => {
    setEditingEventId(evt._id);
    setForm({
      title: evt.title || '',
      chiefGuest: evt.chiefGuest || '',
      chiefGuestDesignation: evt.chiefGuestDesignation || '',
      chiefGuestCompany: evt.chiefGuestCompany || '',
      chiefGuestEmail: evt.chiefGuestEmail || '',
      chiefGuestPhone: evt.chiefGuestPhone || '',
      chiefGuestBio: evt.chiefGuestBio || '',
      chiefGuestLinkedin: evt.chiefGuestLinkedin || '',
      prerequisites: evt.prerequisites || '',
      registrationDeadline: evt.registrationDeadline ? evt.registrationDeadline.split('T')[0] : '',
      eventDate: evt.eventDate ? evt.eventDate.split('T')[0] : '',
      isMultiDay: !!evt.isMultiDay,
      endDate: evt.endDate ? evt.endDate.split('T')[0] : '',
      durationDays: evt.durationDays || 1,
      scheduleType: evt.scheduleType || (evt.isMultiDay ? 'Multi-Day Training' : 'Single Day'),
      dailyTimingNote: evt.dailyTimingNote || '',
      startTime: evt.startTime || '10:00 AM',
      endTime: evt.endTime || '01:00 PM',
      venue: evt.venue || '',
      departments: evt.departments || ALL_DEPARTMENTS,
      eligibleBatches: evt.eligibleBatches || ['2022-2026'],
      eventType: evt.eventType || 'Training',
      status: evt.status || 'Upcoming',
      description: evt.description || '',
      maxParticipants: evt.maxParticipants || 150,
      autoRegisterEligible: false,
    });
    setShowEventModal(true);
  };

  const handleDepartmentToggle = (dept) => {
    setForm((prev) => {
      const exists = prev.departments.includes(dept);
      if (exists) {
        if (prev.departments.length === 1) {
          toast.error('At least one department must be selected');
          return prev;
        }
        return { ...prev, departments: prev.departments.filter((d) => d !== dept) };
      } else {
        return { ...prev, departments: [...prev.departments, dept] };
      }
    });
  };

  const handleBatchToggle = (b) => {
    setForm((prev) => {
      const exists = prev.eligibleBatches.includes(b);
      if (exists) {
        if (prev.eligibleBatches.length === 1) return prev;
        return { ...prev, eligibleBatches: prev.eligibleBatches.filter((item) => item !== b) };
      } else {
        return { ...prev, eligibleBatches: [...prev.eligibleBatches, b] };
      }
    });
  };

  // Submit Create / Edit Event
  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Event name is required');
    if (!form.chiefGuest.trim()) return toast.error('Chief guest name is required');
    if (!form.eventDate) return toast.error('Event date is required');
    if (form.isMultiDay) {
      if (!form.endDate) return toast.error('Please select an end date for multi-day training');
      if (form.endDate < form.eventDate) return toast.error('End date cannot be earlier than start date');
    }
    if (!form.venue.trim()) return toast.error('Venue is required');
    if (!form.departments.length) return toast.error('Select at least one department');

    try {
      setSavingEvent(true);
      if (editingEventId) {
        await updateEvent(editingEventId, form);
        toast.success('Event updated successfully');
      } else {
        await createEvent(form);
        toast.success('Upcoming event created successfully');
      }
      setShowEventModal(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSavingEvent(false);
    }
  };

  // Delete Event
  const handleConfirmDelete = async () => {
    if (!deleteEventId) return;
    try {
      await deleteEvent(deleteEventId);
      toast.success('Event deleted successfully');
      setDeleteEventId(null);
      if (activeEvent?._id === deleteEventId) setActiveEvent(null);
      fetchEvents();
    } catch {
      toast.error('Failed to delete event');
    }
  };

  // Open Attendance Modal
  const handleOpenAttendance = (evt) => {
    setActiveEvent(evt);
    setAttendanceSearch('');
    setAttendanceDeptFilter('ALL');
    setAttendanceStatusFilter('all');
    setShowAddStudentForm(false);
  };

  // Toggle Single Student Attendance Status
  const handleToggleStudentStatus = async (recordId, currentStatus) => {
    if (!activeEvent) return;
    const nextStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    try {
      const res = await updateAttendanceStatus(activeEvent._id, recordId, { status: nextStatus });
      toast.success(`Marked as ${nextStatus}`);
      setActiveEvent(res.data);
      setEvents((prev) => prev.map((ev) => (ev._id === res.data._id ? res.data : ev)));
    } catch {
      toast.error('Failed to update attendance status');
    }
  };

  // Bulk Update Attendance
  const handleBulkAttendance = async (status) => {
    if (!activeEvent) return;
    try {
      const res = await bulkUpdateAttendance(activeEvent._id, {
        status,
        department: attendanceDeptFilter !== 'ALL' ? attendanceDeptFilter : undefined,
      });
      toast.success(`Marked ${status} for ${attendanceDeptFilter !== 'ALL' ? attendanceDeptFilter : 'all'} students`);
      setActiveEvent(res.data);
      setEvents((prev) => prev.map((ev) => (ev._id === res.data._id ? res.data : ev)));
    } catch {
      toast.error('Failed to update attendance in bulk');
    }
  };

  // Auto-Register Students
  const handleAutoRegister = async () => {
    if (!activeEvent) return;
    try {
      const res = await autoRegisterStudents(activeEvent._id, {
        department: attendanceDeptFilter !== 'ALL' ? attendanceDeptFilter : undefined,
        count: 50,
      });
      toast.success(res.message || 'Students auto-registered');
      setActiveEvent(res.data);
      setEvents((prev) => prev.map((ev) => (ev._id === res.data._id ? res.data : ev)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to auto-register students');
    }
  };

  // Add Manual Student to Attendance
  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    if (!newStudent.studentName.trim() || !newStudent.rollNumber.trim()) {
      return toast.error('Name and Roll Number are required');
    }
    try {
      const res = await addStudentToAttendance(activeEvent._id, newStudent);
      toast.success('Student added to roster');
      setActiveEvent(res.data);
      setEvents((prev) => prev.map((ev) => (ev._id === res.data._id ? res.data : ev)));
      setNewStudent({
        studentName: '',
        rollNumber: '',
        department: 'CSE',
        batch: '2022-2026',
        status: 'Present',
      });
      setShowAddStudentForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    }
  };

  // Remove Student from Attendance
  const handleRemoveStudent = async (recordId) => {
    if (!window.confirm('Remove this student from the attendance roster?')) return;
    try {
      const res = await removeStudentFromAttendance(activeEvent._id, recordId);
      toast.success('Student removed');
      setActiveEvent(res.data);
      setEvents((prev) => prev.map((ev) => (ev._id === res.data._id ? res.data : ev)));
    } catch {
      toast.error('Failed to remove student');
    }
  };

  // Filtered Roster for Active Event
  const filteredRoster = useMemo(() => {
    if (!activeEvent || !activeEvent.attendance) return [];
    return activeEvent.attendance.filter((rec) => {
      const matchSearch =
        rec.studentName.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
        rec.rollNumber.toLowerCase().includes(attendanceSearch.toLowerCase());
      const matchDept = attendanceDeptFilter === 'ALL' || rec.department === attendanceDeptFilter;
      const matchStatus = attendanceStatusFilter === 'all' || rec.status === attendanceStatusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [activeEvent, attendanceSearch, attendanceDeptFilter, attendanceStatusFilter]);

  // Export Attendance to Excel
  const handleExportExcel = () => {
    if (!activeEvent || !activeEvent.attendance) return;
    const dataToExport = filteredRoster.map((rec, index) => ({
      'S.No': index + 1,
      'Roll Number': rec.rollNumber,
      'Student Name': rec.studentName,
      Department: rec.department,
      Batch: rec.batch,
      'Attendance Status': rec.status,
      'Marked Time': rec.markedAt ? new Date(rec.markedAt).toLocaleString('en-IN') : 'N/A',
      Remarks: rec.remarks || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    const filename = `${activeEvent.title.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance.xlsx`;
    XLSX.writeFile(workbook, filename);
    toast.success('Attendance exported to Excel');
  };

  // Export Attendance to PDF
  const handleExportPDF = () => {
    if (!activeEvent || !activeEvent.attendance) return;
    const doc = new jsPDF();

    // Header Title
    doc.setFontSize(16);
    doc.setTextColor(11, 29, 55);
    doc.text('NADAR SARASWATHI COLLEGE OF ENGINEERING & TECHNOLOGY', 14, 15);
    doc.setFontSize(12);
    doc.setTextColor(197, 158, 81);
    doc.text(`Event Attendance: ${activeEvent.title}`, 14, 23);

    // Event Details Subhead
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const dateStr = activeEvent.isMultiDay && activeEvent.endDate
      ? `${new Date(activeEvent.eventDate).toLocaleDateString('en-IN')} - ${new Date(activeEvent.endDate).toLocaleDateString('en-IN')} (${activeEvent.durationDays || 'Multi'} Days)`
      : activeEvent.eventDate ? new Date(activeEvent.eventDate).toLocaleDateString('en-IN') : '';
    doc.text(`Chief Guest: ${activeEvent.chiefGuest} | Venue: ${activeEvent.venue} | Date: ${dateStr}`, 14, 29);
    doc.text(
      `Total Registered: ${activeEvent.attendance.length} | Present: ${
        activeEvent.attendance.filter((a) => a.status === 'Present').length
      } | Attendance Rate: ${activeEvent.attendancePercentage || 0}%`,
      14,
      35
    );

    const tableRows = filteredRoster.map((rec, idx) => [
      idx + 1,
      rec.rollNumber,
      rec.studentName,
      rec.department,
      rec.batch,
      rec.status,
    ]);

    doc.autoTable({
      startY: 40,
      head: [['#', 'Roll Number', 'Student Name', 'Dept', 'Batch', 'Attendance']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [11, 29, 55], textColor: 255 },
      styles: { fontSize: 8 },
    });

    const filename = `${activeEvent.title.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance.pdf`;
    doc.save(filename);
    toast.success('Attendance exported to PDF');
  };

  // Color helper for Event Type
  const getTypePillStyle = (type) => {
    switch (type) {
      case 'Training':
      case 'Technical Training':
        return { background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' };
      case 'Aptitude Training':
        return { background: '#fefce8', color: '#ca8a04', border: '1px solid #fef08a' };
      case 'Soft Skills Training':
        return { background: '#faf5ff', color: '#a855f7', border: '1px solid #e9d5ff' };
      case 'Workshop':
        return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
      case 'Guest Lecture':
        return { background: '#fdf4ff', color: '#9333ea', border: '1px solid #f0abfc' };
      case 'Bootcamp':
        return { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
      case 'Seminar':
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
      case 'Mock Interview Drive':
        return { background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3' };
      case 'Hackathon':
        return { background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe' };
      case 'Webinar':
        return { background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd' };
      case 'Orientation':
        return { background: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5' };
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  const getStatusBadgeStyle = (st) => {
    switch (st) {
      case 'Upcoming':
        return { background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' };
      case 'Ongoing':
        return { background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' };
      case 'Completed':
        return { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
      case 'Cancelled':
        return { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' };
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  return (
    <div className="events-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Placement Events & Training Modules</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Schedule and manage upcoming guest lectures, technical workshops, training modules, and live student attendance.
          </p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchEvents} title="Refresh">
            <HiOutlineRefresh /> Refresh
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <HiOutlinePlus /> Add Event / Training
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="events-kpi-grid">
        <div className="event-kpi-card">
          <div className="event-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <HiOutlineCalendar />
          </div>
          <div className="event-kpi-info">
            <span className="event-kpi-label">Total Events</span>
            <span className="event-kpi-value">{stats.total}</span>
          </div>
        </div>

        <div className="event-kpi-card">
          <div className="event-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <HiOutlineSparkles />
          </div>
          <div className="event-kpi-info">
            <span className="event-kpi-label">Upcoming Events</span>
            <span className="event-kpi-value">{stats.upcoming}</span>
          </div>
        </div>

        <div className="event-kpi-card">
          <div className="event-kpi-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <HiOutlineUserGroup />
          </div>
          <div className="event-kpi-info">
            <span className="event-kpi-label">Registered Students</span>
            <span className="event-kpi-value">{stats.totalRegistered}</span>
          </div>
        </div>

        <div className="event-kpi-card">
          <div className="event-kpi-icon" style={{ background: '#fdf4ff', color: '#9333ea' }}>
            <HiOutlineCheck />
          </div>
          <div className="event-kpi-info">
            <span className="event-kpi-label">Overall Attendance</span>
            <span className="event-kpi-value">{stats.rate}%</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="events-toolbar">
        <div className="events-toolbar-left">
          <div className="search-box">
            <HiOutlineSearch />
            <input
              type="text"
              placeholder="Search by event, chief guest, venue..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <HiOutlineX />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineFilter style={{ color: '#64748b' }} />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <select
            className="filter-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {ALL_DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                Dept: {d}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Event Types</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="events-toolbar-right">
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Showing <strong>{events.length}</strong> Events
          </span>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <Loader text="Loading placement events & training schedules..." />
      ) : events.length === 0 ? (
        <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
          <div className="empty-state-icon" style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
            📅
          </div>
          <h3 className="empty-state-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            No Placement Events Found
          </h3>
          <p className="empty-state-text" style={{ color: '#64748b', maxWidth: '440px', margin: '6px auto 18px' }}>
            No upcoming events match the current search filters. Click "Add Event / Training" to schedule a lecture or training session.
          </p>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <HiOutlinePlus /> Create First Event / Training
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((evt) => {
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

            const total = evt.attendance ? evt.attendance.length : 0;
            const present = evt.attendance ? evt.attendance.filter((a) => a.status === 'Present').length : 0;
            const pct = total > 0 ? Math.round((present / total) * 100) : 0;

            const isTrainingType = evt.eventType?.toLowerCase().includes('training') || evt.eventType === 'Bootcamp' || evt.eventType === 'Workshop';

            return (
              <div key={evt._id} className="event-card">
                {/* Card Header with Date Badge & Title */}
                <div className="event-card-header">
                  <div className="event-date-badge" style={{ minWidth: isMultiDay ? '64px' : '56px' }}>
                    <span className="month">{monthStr}</span>
                    <span className="day" style={{ fontSize: isMultiDay ? '1.05rem' : '1.35rem', lineHeight: 1.1 }}>
                      {isMultiDay ? `${dayStr}–${endDayStr}` : dayStr}
                    </span>
                    <span className="year">{yearStr}</span>
                  </div>

                  <div className="event-title-wrap">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className="event-type-pill" style={getTypePillStyle(evt.eventType)}>
                        {evt.eventType}
                      </span>
                      <span className="event-type-pill" style={getStatusBadgeStyle(evt.status)}>
                        {evt.status}
                      </span>
                      {isMultiDay && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fde68a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          🗓️ {evt.durationDays ? `${evt.durationDays} Days / ${evt.durationDays >= 6 ? Math.round(evt.durationDays / 6) + ' Wk' : evt.durationDays + 'D'}` : 'Multi-Day'}
                        </span>
                      )}
                    </div>
                    <h3 className="event-card-title">{evt.title}</h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="event-card-body">
                  {/* Chief Guest / Resource Person Spotlight */}
                  <div className="chief-guest-box">
                    <div className="chief-guest-avatar">
                      {evt.chiefGuest
                        ? evt.chiefGuest
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                        : 'RP'}
                    </div>
                    <div className="chief-guest-details" style={{ flex: 1, minWidth: 0 }}>
                      <span className="chief-guest-label">
                        {isTrainingType ? '⭐ Resource Person / Trainer' : '⭐ Chief Guest / Keynote Speaker'}
                      </span>
                      <span className="chief-guest-name">{evt.chiefGuest}</span>
                      <span className="chief-guest-sub">
                        {evt.chiefGuestDesignation || 'Invited Industry Expert'}
                        {evt.chiefGuestCompany ? ` • ${evt.chiefGuestCompany}` : ''}
                      </span>
                      {evt.chiefGuestBio && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.74rem', color: '#64748b', lineHeight: 1.3 }}>
                          {evt.chiefGuestBio}
                        </p>
                      )}
                      {(evt.chiefGuestEmail || evt.chiefGuestPhone || evt.chiefGuestLinkedin) && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.72rem', color: '#475569' }}>
                          {evt.chiefGuestEmail && <span>✉️ {evt.chiefGuestEmail}</span>}
                          {evt.chiefGuestPhone && <span>📞 {evt.chiefGuestPhone}</span>}
                          {evt.chiefGuestLinkedin && (
                            <a
                              href={evt.chiefGuestLinkedin}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
                            >
                              🔗 LinkedIn
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date, Time & Venue */}
                  <div className="event-info-list">
                    {isMultiDay && (
                      <div className="event-info-item" style={{ color: '#b45309', fontWeight: 600 }}>
                        <HiOutlineCalendar style={{ color: '#d97706' }} />
                        <span><strong>Duration:</strong> {dateRangeLabel} ({evt.durationDays || 'Multi'} Days Program)</span>
                      </div>
                    )}
                    <div className="event-info-item">
                      <HiOutlineClock />
                      <span>
                        {isMultiDay ? <strong>Daily Sessions: </strong> : null}
                        {evt.startTime} – {evt.endTime || 'Wrap up'}
                      </span>
                    </div>
                    {isMultiDay && evt.dailyTimingNote && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', paddingLeft: '20px', marginTop: '-4px' }}>
                        ℹ️ {evt.dailyTimingNote}
                      </div>
                    )}
                    <div className="event-info-item">
                      <HiOutlineLocationMarker />
                      <span><strong>Venue:</strong> {evt.venue}</span>
                    </div>
                  </div>

                  {/* Prerequisites if any */}
                  {evt.prerequisites && (
                    <div style={{ fontSize: '0.75rem', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', color: '#475569' }}>
                      <strong>📌 Pre-requisites:</strong> {evt.prerequisites}
                    </div>
                  )}

                  {/* Target Departments */}
                  <div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Eligible Departments:
                    </span>
                    <div className="event-depts-wrap" style={{ marginTop: '4px' }}>
                      {evt.departments?.map((d) => (
                        <span key={d} className="dept-pill">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Attendance Progress Tracker */}
                  <div className="event-attendance-progress">
                    <div className="attendance-progress-header">
                      <span>Live Attendance</span>
                      <span>
                        <strong>{present}</strong> / {total} Attended ({pct}%)
                      </span>
                    </div>
                    <div className="attendance-bar-bg">
                      <div className="attendance-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="event-card-footer">
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEditModal(evt)}
                      title="Edit Event"
                    >
                      <HiOutlinePencilAlt /> Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setDeleteEventId(evt._id)}
                      title="Delete Event"
                      style={{ padding: '6px 10px' }}
                    >
                      <HiOutlineTrash />
                    </button>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleOpenAttendance(evt)}
                    style={{ gap: '6px' }}
                  >
                    <HiOutlineUserGroup /> Attendance ({total})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT EVENT MODAL (Portalled to document.body)                       */}
      {/* ========================================================================= */}
      {showEventModal &&
        createPortal(
          <div className="form-overlay" onClick={() => setShowEventModal(false)}>
            <div
              className="form-modal form-modal-lg"
              onClick={(e) => e.stopPropagation()}
              style={{ width: 'min(760px, 95vw)', maxWidth: '760px' }}
            >
              <div className="form-header">
                <h3 className="form-title">
                  {editingEventId ? 'Edit Event / Training Module' : 'Add New Event or Training Session'}
                </h3>
                <button
                  type="button"
                  className="form-close"
                  onClick={() => setShowEventModal(false)}
                >
                  <HiOutlineX />
                </button>
              </div>

              <form onSubmit={handleSubmitEvent} style={{ width: '100%', overflow: 'hidden' }}>
                <div
                  className="form-body"
                  style={{
                    maxHeight: '74vh',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '22px 26px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                  }}
                >
                  
                  {/* --- Section 1: Overview & Schedule --- */}
                  <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', width: '100%' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-start, #0b1d37)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎯</span> Event & Training Overview
                    </h4>

                    {/* Event Name */}
                    <div className="form-group" style={{ marginBottom: '14px', width: '100%' }}>
                      <label className="form-label required">Event / Training Title</label>
                      <input
                        className="form-input"
                        required
                        placeholder="e.g. Masterclass on System Design & Full-Stack Deployment"
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                      />
                    </div>

                    {/* Event Type & Status */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px', width: '100%' }}>
                      <div className="form-group">
                        <label className="form-label required">Category / Type</label>
                        <select
                          className="form-select"
                          value={form.eventType}
                          onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                        >
                          {EVENT_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                          className="form-select"
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Ongoing">Ongoing</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Schedule / Duration Mode Toggle */}
                    <div
                      style={{
                        marginBottom: '14px',
                        background: '#f8fafc',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0b1d37' }}>
                          🗓️ Event Schedule & Duration Mode
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Select single session or multi-day program
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, isMultiDay: false, scheduleType: 'Single Day' })}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: !form.isMultiDay ? '2px solid #0b1d37' : '1px solid #cbd5e1',
                            background: !form.isMultiDay ? '#ffffff' : '#f8fafc',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: !form.isMultiDay ? '0 2px 8px rgba(11,29,55,0.08)' : 'none',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: !form.isMultiDay ? '#0b1d37' : '#475569' }}>
                            📅 Single Day Event
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                            Conducted on a specific date & time slot
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            let end = form.endDate;
                            if (!end && form.eventDate) {
                              const d = new Date(form.eventDate);
                              d.setDate(d.getDate() + 5);
                              end = d.toISOString().split('T')[0];
                            }
                            setForm({
                              ...form,
                              isMultiDay: true,
                              scheduleType: 'Multi-Day Training',
                              endDate: end || '',
                              durationDays: form.durationDays && form.durationDays > 1 ? form.durationDays : 6,
                            });
                          }}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: form.isMultiDay ? '2px solid #c59e51' : '1px solid #cbd5e1',
                            background: form.isMultiDay ? '#fffdfa' : '#f8fafc',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: form.isMultiDay ? '0 2px 8px rgba(197,158,81,0.18)' : 'none',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.86rem', color: form.isMultiDay ? '#b45309' : '#475569' }}>
                            🗓️ Multi-Day / 1-Week Training Program
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px' }}>
                            Spans multiple days with recurring daily timing
                          </div>
                        </button>
                      </div>

                      {/* If Multi-Day, show quick preset buttons */}
                      {form.isMultiDay && (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>
                              ⚡ Quick Duration Presets:
                            </span>
                            {form.durationDays && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>
                                Duration: {form.durationDays} Days ({form.durationDays >= 6 ? Math.round(form.durationDays / 6) + ' Wk' : form.durationDays + ' D'})
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                              { label: '⚡ 1 Week (6 Days Mon–Sat)', days: 6 },
                              { label: '⚡ 5 Days (Mon–Fri)', days: 5 },
                              { label: '⚡ 3 Days Workshop', days: 3 },
                              { label: '⚡ 2 Weeks (12 Days)', days: 12 },
                            ].map((preset) => (
                              <button
                                key={preset.days}
                                type="button"
                                onClick={() => {
                                  const start = form.eventDate ? new Date(form.eventDate) : new Date();
                                  const end = new Date(start);
                                  end.setDate(end.getDate() + (preset.days - 1));
                                  setForm({
                                    ...form,
                                    isMultiDay: true,
                                    eventDate: form.eventDate || start.toISOString().split('T')[0],
                                    endDate: end.toISOString().split('T')[0],
                                    durationDays: preset.days,
                                    scheduleType: preset.label.replace('⚡ ', ''),
                                  });
                                }}
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: form.durationDays === preset.days ? '1.5px solid #b45309' : '1px solid #cbd5e1',
                                  background: form.durationDays === preset.days ? '#fef3c7' : '#ffffff',
                                  color: form.durationDays === preset.days ? '#92400e' : '#334155',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Date Row (2 columns if multi-day, 1 column if single-day) */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: form.isMultiDay ? '1fr 1fr' : '1fr',
                        gap: '14px',
                        marginBottom: '14px',
                        width: '100%',
                      }}
                    >
                      <div className="form-group">
                        <label className="form-label required">
                          {form.isMultiDay ? 'Training Start Date' : 'Event Date'}
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          required
                          value={form.eventDate}
                          onChange={(e) => {
                            const newStart = e.target.value;
                            let newEnd = form.endDate;
                            let dur = form.durationDays;
                            if (form.isMultiDay && newStart) {
                              if (dur && dur > 1) {
                                const d = new Date(newStart);
                                d.setDate(d.getDate() + (dur - 1));
                                newEnd = d.toISOString().split('T')[0];
                              } else if (newEnd && newEnd < newStart) {
                                newEnd = newStart;
                              }
                            }
                            setForm({ ...form, eventDate: newStart, endDate: newEnd });
                          }}
                        />
                      </div>

                      {form.isMultiDay && (
                        <div className="form-group">
                          <label className="form-label required">Training End Date</label>
                          <input
                            type="date"
                            className="form-input"
                            required={form.isMultiDay}
                            value={form.endDate}
                            min={form.eventDate}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              let dur = form.durationDays;
                              if (form.eventDate && newEnd) {
                                const s = new Date(form.eventDate);
                                const en = new Date(newEnd);
                                dur = Math.max(1, Math.round((en - s) / (1000 * 60 * 60 * 24)) + 1);
                              }
                              setForm({ ...form, endDate: newEnd, durationDays: dur });
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Time Row (2 columns: Start Time & End Time) */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '14px',
                        marginBottom: '14px',
                        width: '100%',
                      }}
                    >
                      <div className="form-group">
                        <label className="form-label required">
                          {form.isMultiDay ? 'Daily Session Start Time' : 'Start Time'}
                        </label>
                        <input
                          className="form-input"
                          required
                          placeholder="09:30 AM"
                          value={form.startTime}
                          onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          {form.isMultiDay ? 'Daily Session End Time' : 'End Time'}
                        </label>
                        <input
                          className="form-input"
                          placeholder="04:30 PM"
                          value={form.endTime}
                          onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                        />
                      </div>
                    </div>

                    {form.isMultiDay && (
                      <div className="form-group" style={{ marginBottom: '14px', width: '100%' }}>
                        <label className="form-label">Daily Timing / Routine Note</label>
                        <input
                          className="form-input"
                          placeholder="e.g. Daily Sessions: 09:30 AM – 04:30 PM (Lunch break: 12:45 – 01:45 PM)"
                          value={form.dailyTimingNote}
                          onChange={(e) => setForm({ ...form, dailyTimingNote: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Venue & Capacity Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '14px', width: '100%' }}>
                      <div className="form-group">
                        <label className="form-label required">Venue / Room / Platform</label>
                        <input
                          className="form-input"
                          required
                          placeholder="e.g. Main Auditorium / CSE Lab 3 / Online Google Meet"
                          value={form.venue}
                          onChange={(e) => setForm({ ...form, venue: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Max Seat Capacity</label>
                        <input
                          type="number"
                          className="form-input"
                          placeholder="150"
                          value={form.maxParticipants}
                          onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* --- Section 2: Resource Person Details --- */}
                  <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-start, #0b1d37)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>👤</span> Resource Person / Trainer / Chief Guest Details
                    </h4>

                    {/* Name & Designation */}
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label className="form-label required">Resource Person Name</label>
                        <input
                          className="form-input"
                          required
                          placeholder="e.g. Dr. K. Senthil Nathan / Mr. Rajesh Kumar"
                          value={form.chiefGuest}
                          onChange={(e) => setForm({ ...form, chiefGuest: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Designation / Role</label>
                        <input
                          className="form-input"
                          placeholder="e.g. Principal Cloud Architect / Master Placement Trainer"
                          value={form.chiefGuestDesignation}
                          onChange={(e) => setForm({ ...form, chiefGuestDesignation: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Organization & LinkedIn */}
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Company / Organization</label>
                        <input
                          className="form-input"
                          placeholder="e.g. Amazon Web Services / Zoho Corp / Cognizant"
                          value={form.chiefGuestCompany}
                          onChange={(e) => setForm({ ...form, chiefGuestCompany: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LinkedIn Profile URL</label>
                        <input
                          className="form-input"
                          placeholder="https://linkedin.com/in/username"
                          value={form.chiefGuestLinkedin}
                          onChange={(e) => setForm({ ...form, chiefGuestLinkedin: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Contact Email</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="e.g. trainer@organization.com"
                          value={form.chiefGuestEmail}
                          onChange={(e) => setForm({ ...form, chiefGuestEmail: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Contact Phone / WhatsApp</label>
                        <input
                          className="form-input"
                          placeholder="+91 98765 43210"
                          value={form.chiefGuestPhone}
                          onChange={(e) => setForm({ ...form, chiefGuestPhone: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Bio / Expertise */}
                    <div className="form-group">
                      <label className="form-label">Resource Person Profile & Key Credentials</label>
                      <textarea
                        className="form-textarea"
                        rows="2"
                        placeholder="Brief summary of experience, notable achievements, company background..."
                        value={form.chiefGuestBio}
                        onChange={(e) => setForm({ ...form, chiefGuestBio: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* --- Section 3: Eligibility & Requirements --- */}
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-start, #0b1d37)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🎓</span> Eligibility & Training Syllabus
                    </h4>

                    {/* Eligible Departments */}
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label required">
                        Eligible Departments ({form.departments.length} selected)
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {ALL_DEPARTMENTS.map((dept) => {
                          const active = form.departments.includes(dept);
                          return (
                            <button
                              key={dept}
                              type="button"
                              onClick={() => handleDepartmentToggle(dept)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '18px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: active ? '1px solid #0b1d37' : '1px solid #cbd5e1',
                                background: active ? '#0b1d37' : '#f8fafc',
                                color: active ? '#ffffff' : '#475569',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {active ? '✓ ' : ''}
                              {dept}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Eligible Batches */}
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Target Batches</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {ALL_BATCHES.map((b) => {
                          const active = form.eligibleBatches.includes(b);
                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() => handleBatchToggle(b)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '16px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: active ? '1px solid #c59e51' : '1px solid #cbd5e1',
                                background: active ? 'rgba(197, 158, 81, 0.15)' : '#f8fafc',
                                color: active ? '#b45309' : '#475569',
                              }}
                            >
                              {b}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Pre-requisites */}
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Pre-requisites / Student Requirements</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Bring personal laptop with Node.js and VS Code installed, basic SQL knowledge"
                        value={form.prerequisites}
                        onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
                      />
                    </div>

                    {/* Description / Agenda */}
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label className="form-label">Detailed Agenda & Takeaways</label>
                      <textarea
                        className="form-textarea"
                        rows="3"
                        placeholder="Outline modules covered, hands-on activities, interview preparation topics..."
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                      />
                    </div>

                    {/* Auto-register option for new event */}
                    {!editingEventId && (
                      <div
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <input
                          type="checkbox"
                          id="autoReg"
                          checked={form.autoRegisterEligible}
                          onChange={(e) => setForm({ ...form, autoRegisterEligible: e.target.checked })}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="autoReg" style={{ fontSize: '0.85rem', color: '#1e293b', cursor: 'pointer', fontWeight: 500 }}>
                          Auto-populate attendance roster with eligible students from selected departments
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEventModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={savingEvent}>
                    {savingEvent ? 'Saving...' : editingEventId ? 'Update Event / Training' : 'Create Event / Training'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* ATTENDANCE ROSTER & MARKING MODAL (Portalled to document.body)            */}
      {/* ========================================================================= */}
      {activeEvent &&
        createPortal(
          <div className="attendance-overlay" onClick={() => setActiveEvent(null)}>
            <div className="attendance-modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="attendance-modal-header">
                <div className="attendance-header-left">
                  <div className="attendance-header-icon">
                    <HiOutlineUserGroup />
                  </div>
                  <div className="attendance-header-text">
                    <h2>{activeEvent.title}</h2>
                    <div className="attendance-header-sub">
                      <span><strong>Speaker:</strong> {activeEvent.chiefGuest} ({activeEvent.chiefGuestCompany || 'Guest'})</span>
                      <span>•</span>
                      <span><strong>Venue:</strong> {activeEvent.venue}</span>
                      <span>•</span>
                      <span>
                        <strong>Date / Schedule:</strong>{' '}
                        {activeEvent.isMultiDay && activeEvent.endDate
                          ? `${new Date(activeEvent.eventDate).toLocaleDateString('en-IN')} – ${new Date(activeEvent.endDate).toLocaleDateString('en-IN')} (${activeEvent.durationDays || 'Multi'} Days Program • Daily: ${activeEvent.startTime})`
                          : `${activeEvent.eventDate ? new Date(activeEvent.eventDate).toLocaleDateString('en-IN') : '-'} (${activeEvent.startTime})`}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="sd-close-btn"
                    onClick={() => setActiveEvent(null)}
                    title="Close Attendance"
                  >
                    <HiOutlineX />
                  </button>
                </div>
              </div>

              {/* Stats Ribbon */}
              <div className="attendance-stats-ribbon">
                <div className="attendance-metric-chips">
                  <span className="metric-chip total">
                    Total Registered: <strong>{activeEvent.attendance?.length || 0}</strong>
                  </span>
                  <span className="metric-chip present">
                    Present: <strong>{activeEvent.attendance?.filter((a) => a.status === 'Present').length || 0}</strong>
                  </span>
                  <span className="metric-chip absent">
                    Absent: <strong>{activeEvent.attendance?.filter((a) => a.status === 'Absent').length || 0}</strong>
                  </span>
                  <span className="metric-chip rate">
                    Attendance Rate: <strong>{activeEvent.attendancePercentage || 0}%</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportExcel} title="Download Excel">
                    <HiOutlineDownload /> Excel
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleExportPDF} title="Download PDF">
                    <HiOutlineDocumentText /> PDF
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="attendance-modal-body">
                {/* Roster Controls */}
                <div className="roster-toolbar">
                  <div className="roster-toolbar-left">
                    <div className="search-box" style={{ minWidth: '220px' }}>
                      <HiOutlineSearch />
                      <input
                        type="text"
                        placeholder="Search student or roll no..."
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        className="search-input"
                      />
                    </div>

                    <select
                      className="filter-select"
                      value={attendanceDeptFilter}
                      onChange={(e) => setAttendanceDeptFilter(e.target.value)}
                    >
                      <option value="ALL">All Departments</option>
                      {activeEvent.departments?.map((d) => (
                        <option key={d} value={d}>
                          Dept: {d}
                        </option>
                      ))}
                    </select>

                    <select
                      className="filter-select"
                      value={attendanceStatusFilter}
                      onChange={(e) => setAttendanceStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Present">Present Only</option>
                      <option value="Absent">Absent Only</option>
                      <option value="Registered">Registered Only</option>
                    </select>
                  </div>

                  <div className="roster-toolbar-right">
                    <button
                      className="btn btn-sm"
                      style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                      onClick={() => handleBulkAttendance('Present')}
                      title="Mark current filtered list as Present"
                    >
                      ✓ Mark All Present
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                      onClick={() => handleBulkAttendance('Absent')}
                      title="Mark current filtered list as Absent"
                    >
                      ✗ Mark All Absent
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowAddStudentForm(!showAddStudentForm)}
                    >
                      <HiOutlineUserAdd /> Add Student
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleAutoRegister}
                      title="Pull 50 more students from eligible departments"
                    >
                      <HiOutlineRefresh /> Auto-Fetch
                    </button>
                  </div>
                </div>

                {/* Inline Add Student Form */}
                {showAddStudentForm && (
                  <form
                    onSubmit={handleAddStudentSubmit}
                    style={{
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr)) 100px',
                      gap: '10px',
                      alignItems: 'end',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Roll Number</label>
                      <input
                        className="form-input"
                        placeholder="e.g. 22CSE045"
                        required
                        value={newStudent.rollNumber}
                        onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Student Name</label>
                      <input
                        className="form-input"
                        placeholder="e.g. Rahul Sharma"
                        required
                        value={newStudent.studentName}
                        onChange={(e) => setNewStudent({ ...newStudent, studentName: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Department</label>
                      <select
                        className="form-select"
                        value={newStudent.department}
                        onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      >
                        {ALL_DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Batch</label>
                      <select
                        className="form-select"
                        value={newStudent.batch}
                        onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      >
                        {ALL_BATCHES.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>Initial Status</label>
                      <select
                        className="form-select"
                        value={newStudent.status}
                        onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}
                        style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                      >
                        <option value="Present">Present</option>
                        <option value="Registered">Registered</option>
                        <option value="Absent">Absent</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px' }}>
                      Add
                    </button>
                  </form>
                )}

                {/* Interactive Roster Table */}
                <div className="attendance-table-wrap">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Roll Number</th>
                        <th>Student Name</th>
                        <th>Department</th>
                        <th>Batch</th>
                        <th>Attendance Status (Click to Toggle)</th>
                        <th>Marked Time</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoster.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                            No students match the selected roster filters.
                          </td>
                        </tr>
                      ) : (
                        filteredRoster.map((rec, index) => {
                          const isPresent = rec.status === 'Present';
                          const isAbsent = rec.status === 'Absent';
                          const isRegistered = rec.status === 'Registered';

                          return (
                            <tr key={rec._id || index}>
                              <td>{index + 1}</td>
                              <td>
                                <strong style={{ color: '#0f172a' }}>{rec.rollNumber}</strong>
                              </td>
                              <td>{rec.studentName}</td>
                              <td>
                                <span className="dept-pill">{rec.department}</span>
                              </td>
                              <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{rec.batch}</td>
                              <td>
                                <button
                                  type="button"
                                  className={`status-toggle-btn ${
                                    isPresent ? 'present' : isAbsent ? 'absent' : 'registered'
                                  }`}
                                  onClick={() => handleToggleStudentStatus(rec._id, rec.status)}
                                  title="Click to toggle Present / Absent"
                                >
                                  {isPresent && '✓ Present'}
                                  {isAbsent && '✗ Absent'}
                                  {isRegistered && '○ Registered'}
                                </button>
                              </td>
                              <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {rec.markedAt ? new Date(rec.markedAt).toLocaleTimeString('en-IN') : '-'}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudent(rec._id)}
                                  title="Remove from attendance"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    padding: '4px',
                                  }}
                                >
                                  <HiOutlineTrash />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="attendance-modal-footer">
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Showing <strong>{filteredRoster.length}</strong> of{' '}
                  <strong>{activeEvent.attendance?.length || 0}</strong> students
                </span>

                <button className="btn btn-secondary" onClick={() => setActiveEvent(null)}>
                  Done / Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation */}
      {deleteEventId && (
        <ConfirmModal
          title="Delete Event"
          message="Are you sure you want to delete this event and its full attendance roster? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteEventId(null)}
        />
      )}
    </div>
  );
};

export default EventsPage;
