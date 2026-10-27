import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineChartBar,
  HiOutlinePlus,
  HiOutlinePencilAlt,
  HiOutlineTrash,
  HiOutlinePrinter,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineOfficeBuilding,
  HiOutlineBookOpen,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineSwitchHorizontal,
  HiOutlineArrowDown,
  HiOutlineLocationMarker,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import Loader from '../components/common/Loader';
import {
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getTimeTable,
  saveTimeTableSlot,
  clearTimeTableSlot,
  resetDefaultTimeTable,
  getWorkloadAnalytics,
} from '../api/facultyApi';
import { getEvents } from '../api/eventApi';
import '../styles/facultyTimetable.css';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7];
const DEPARTMENTS = ['ALL', 'CSE', 'IT', 'AIDS', 'ECE', 'EEE', 'MECH', 'CE', 'Placement'];

const YEAR_OPTIONS = [
  { id: 'ALL', label: 'All Years (I, II, III & IV)', short: 'All Years' },
  { id: '1', label: '1st Year (I Year)', short: '1st Year', roman: 'I' },
  { id: '2', label: '2nd Year (II Year)', short: '2nd Year', roman: 'II' },
  { id: '3', label: '3rd Year (III Year)', short: '3rd Year', roman: 'III' },
  { id: '4', label: '4th Year (IV Year)', short: '4th Year', roman: 'IV' },
];

const QUICK_CLASSES_BY_YEAR = {
  1: ['I- CSE', 'I- IT', 'I- AIDS', 'I- ECE', 'I- EEE', 'I- MECH', 'I- CE'],
  2: ['II- CSE', 'II- IT', 'II- AD', 'II- ECE', 'II- EEE', 'II- MECH', 'II- CE'],
  3: ['III- CSE', 'III- IT', 'III- AD', 'III- ECE', 'III- EE', 'III- EEE', 'III- MECH', 'III- CE'],
  4: ['IV - CSE', 'IV- IT & AD', 'IV- ECE', 'IV - EEE, CE, & MECH'],
};

const ALL_QUICK_CLASSES = [
  ...QUICK_CLASSES_BY_YEAR[1],
  ...QUICK_CLASSES_BY_YEAR[2],
  ...QUICK_CLASSES_BY_YEAR[3],
  ...QUICK_CLASSES_BY_YEAR[4],
];

// Helper: deduce Year ('1', '2', '3', '4') from slot
const getSlotYear = (slot) => {
  if (!slot) return '';
  if (slot.year) {
    const y = String(slot.year).trim().toUpperCase();
    if (y === '1' || y === 'I' || y === '1ST' || y === '1ST YEAR' || y === '1ST YEAR (I YEAR)') return '1';
    if (y === '2' || y === 'II' || y === '2ND' || y === '2ND YEAR' || y === '2ND YEAR (II YEAR)') return '2';
    if (y === '3' || y === 'III' || y === '3RD' || y === '3RD YEAR' || y === '3RD YEAR (III YEAR)') return '3';
    if (y === '4' || y === 'IV' || y === '4TH' || y === '4TH YEAR' || y === '4TH YEAR (IV YEAR)') return '4';
  }
  const name = (slot.className || '').toUpperCase();
  if (name.includes('IV') || name.startsWith('4')) return '4';
  if (name.includes('III') || name.startsWith('3')) return '3';
  if (name.includes('II') || name.startsWith('2')) return '2';
  if (name.includes('I-') || name.startsWith('1') || name.startsWith('I ') || name === 'I') return '1';
  return '';
};

// Helper: deduce Dept from slot
const getSlotDept = (slot) => {
  if (!slot) return '';
  if (slot.department) return slot.department.trim().toUpperCase();
  const name = (slot.className || '').toUpperCase();
  for (const d of ['CSE', 'IT', 'AIDS', 'AD', 'ECE', 'EEE', 'MECH', 'CE', 'Placement']) {
    if (name.includes(d.toUpperCase())) {
      if (d === 'AD') return 'AIDS';
      return d;
    }
  }
  return '';
};

const QUICK_TOPICS = [
  'Quantitative Aptitude - Numbers & Percentages',
  'Quantitative Aptitude - Time, Speed & Work',
  'Logical Reasoning & Analytical Thinking',
  'Data Structures & Algorithms - Trees & Graphs',
  'Data Structures - Arrays, Stacks & Queues',
  'Full Stack Web Development & REST APIs',
  'Python Programming & Problem Solving',
  'Machine Learning & Predictive Modeling',
  'Soft Skills, Group Discussion & Mock HR',
  'Verbal Ability & Reading Comprehension',
  'Embedded Systems & IoT Fundamentals',
  'Power Electronics & Control Systems',
  'Company Specific Assessment & Coding Prep',
];

const FacultyTimetablePage = ({ initialTab = null }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');

  const getResolvedTab = useCallback(() => {
    if (initialTab) return initialTab;
    if (location.pathname === '/placement-timetable') return 'timetable';
    if (location.pathname === '/faculty-directory') return 'faculties';
    if (location.pathname === '/workload-analytics') return 'workload';
    if (location.pathname === '/training-dashboard') return 'dashboard';
    if (urlTab && ['dashboard', 'timetable', 'faculties', 'workload'].includes(urlTab)) return urlTab;
    return 'dashboard';
  }, [initialTab, location.pathname, urlTab]);

  const [activeTab, setActiveTab] = useState(getResolvedTab);

  useEffect(() => {
    setActiveTab(getResolvedTab());
  }, [getResolvedTab]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [dayTotals, setDayTotals] = useState({});
  const [events, setEvents] = useState([]);

  // Dashboard Events Filters
  const [dashboardEventCategory, setDashboardEventCategory] = useState('all');
  const [dashboardEventSearch, setDashboardEventSearch] = useState('');

  // Filters
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL'); // 'ALL' | '1' | '2' | '3' | '4'
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState('');
  const [facultySearch, setFacultySearch] = useState('');

  // Workload tab filters
  const [workloadDeptFilter, setWorkloadDeptFilter] = useState('ALL');
  const [workloadSearch, setWorkloadSearch] = useState('');

  // Drag & Drop State
  const [draggedFaculty, setDraggedFaculty] = useState(null);
  const [draggedCell, setDraggedCell] = useState(null); // { day, period, slot }
  const [dragOverCell, setDragOverCell] = useState(null);

  // Edit Slot Modal State
  const [editSlotModal, setEditSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    day: 'MON',
    period: 1,
    span: 1,
    className: '',
    department: '',
    year: '2',
    facultyId: '',
    topic: '',
    room: '',
  });

  // Faculty CRUD Modal State
  const [facultyModal, setFacultyModal] = useState(false);
  const [editingFacultyId, setEditingFacultyId] = useState(null);
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    facultyCode: '',
    department: 'CSE',
    designation: 'Assistant Professor',
    email: '',
    phone: '',
    specialization: '',
    color: '#0284c7',
  });

  // Interactive Reassign / Change Staff Modal State
  const [reassignModal, setReassignModal] = useState({
    isOpen: false,
    mode: 'REASSIGN_FROM_OTHER_CLASS', // 'REASSIGN_FROM_OTHER_CLASS' | 'REPLACE_CLASS_STAFF'
    faculty: null,
    conflictSlot: null,
    day: '',
    period: null,
    targetClass: '',
    targetDept: '',
    targetYear: '',
    existingStaffName: '',
    pendingPayload: null,
  });

  // Fetch data (isInitial = true only on initial component mount)
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    try {
      const [facRes, ttRes, wlRes, evRes] = await Promise.all([
        getFaculties(),
        getTimeTable(),
        getWorkloadAnalytics(),
        getEvents().catch(() => ({ data: [] })),
      ]);
      setFaculties(facRes.data || []);
      setSlots(ttRes.data || []);
      setWorkloads(wlRes.data?.workloads || []);
      setDayTotals(wlRes.data?.totalDayPeriods || {});
      setEvents(evRes.data || []);
    } catch {
      toast.error('Failed to load Faculty & Time Table data');
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Overall event & training statistics for dashboard
  const eventStats = useMemo(() => {
    const total = events.length;
    const upcoming = events.filter((e) => e.status === 'Upcoming' || e.status === 'Ongoing').length;
    let totalRegistered = 0;
    let totalPresent = 0;
    events.forEach((e) => {
      if (e.attendance) {
        totalRegistered += e.attendance.length;
        totalPresent += e.attendance.filter((a) => a.status === 'Present').length;
      }
    });
    const attendanceRate = totalRegistered > 0 ? Math.round((totalPresent / totalRegistered) * 100) : 0;
    return { total, upcoming, totalRegistered, totalPresent, attendanceRate };
  }, [events]);

  // Helper color style for event types
  const getDashboardEventTypeStyle = (type) => {
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
      default:
        return { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' };
    }
  };

  // Filtered Events for Dashboard
  const filteredDashboardEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchSearch =
        !dashboardEventSearch ||
        evt.title?.toLowerCase().includes(dashboardEventSearch.toLowerCase()) ||
        evt.chiefGuest?.toLowerCase().includes(dashboardEventSearch.toLowerCase()) ||
        evt.chiefGuestCompany?.toLowerCase().includes(dashboardEventSearch.toLowerCase()) ||
        evt.venue?.toLowerCase().includes(dashboardEventSearch.toLowerCase());

      const matchCat =
        dashboardEventCategory === 'all' ||
        evt.eventType === dashboardEventCategory ||
        (dashboardEventCategory === 'Training' && evt.eventType?.toLowerCase().includes('training'));

      return matchSearch && matchCat;
    });
  }, [events, dashboardEventSearch, dashboardEventCategory]);

  // Display only 1 row on the dashboard (top 3 events), use "View Full Roster" for full data
  const oneRowDashboardEvents = useMemo(() => {
    return filteredDashboardEvents.slice(0, 3);
  }, [filteredDashboardEvents]);

  // Return ALL slots for a given [day, period]
  const getSlotsAt = useCallback(
    (day, period) => {
      return slots.filter((s) => s.day === day && s.period === period && s.className);
    },
    [slots]
  );

  // Helper: check if a slot matches the current active Year, Dept, and Faculty filters
  const isSlotMatchingFilter = useCallback(
    (slot) => {
      if (!slot || !slot.className) return false;
      const slotYear = getSlotYear(slot);
      const slotDept = getSlotDept(slot);

      const matchYear = selectedYearFilter === 'ALL' || slotYear === selectedYearFilter;
      const matchDept =
        selectedDeptFilter === 'ALL' ||
        slotDept === selectedDeptFilter ||
        (slot.department && slot.department.toUpperCase().includes(selectedDeptFilter)) ||
        (slot.className && slot.className.toUpperCase().includes(selectedDeptFilter));
      const matchFaculty =
        !selectedFacultyFilter ||
        (slot.facultyName &&
          slot.facultyName.toLowerCase() === selectedFacultyFilter.toLowerCase());

      return matchYear && matchDept && matchFaculty;
    },
    [selectedYearFilter, selectedDeptFilter, selectedFacultyFilter]
  );

  // Return ALL matching visible slots at [day, period] (for ALL departments or filtered department)
  const getVisibleSlotsAt = useCallback(
    (day, period) => {
      const cellSlots = getSlotsAt(day, period);
      return cellSlots.filter((slot) => isSlotMatchingFilter(slot));
    },
    [getSlotsAt, isSlotMatchingFilter]
  );

  // Lookup first slot at [day, period]
  const getSlotAt = useCallback(
    (day, period) => {
      return slots.find((s) => s.day === day && s.period === period);
    },
    [slots]
  );

  // Dynamic Sheet Title based on selected Year & Dept filters
  const getDynamicSheetTitle = useCallback(() => {
    let yearText = 'I, II, III & IV YEAR';
    if (selectedYearFilter === '1') yearText = '1st Year (I YEAR)';
    else if (selectedYearFilter === '2') yearText = '2nd Year (II YEAR)';
    else if (selectedYearFilter === '3') yearText = '3rd Year (III YEAR)';
    else if (selectedYearFilter === '4') yearText = '4th Year (IV YEAR)';

    let deptText = '';
    if (selectedDeptFilter !== 'ALL') {
      deptText = ` • ${selectedDeptFilter} DEPARTMENT`;
    }

    return `Placement Class Time Table – ${yearText}${deptText}`;
  }, [selectedYearFilter, selectedDeptFilter]);

  // Open modal to Add a new class on [day, period]
  const handleOpenAddSlot = (day, period) => {
    const dept = selectedDeptFilter !== 'ALL' ? selectedDeptFilter : 'IT';
    const yr = selectedYearFilter !== 'ALL' ? selectedYearFilter : '1';
    const roman = yr === '1' ? 'I' : yr === '2' ? 'II' : yr === '3' ? 'III' : 'IV';
    setSlotForm({
      _id: null,
      day,
      period,
      selectedPeriods: [period],
      span: 1,
      className: `${roman}- ${dept}`,
      department: dept,
      year: yr,
      facultyId: '',
      topic: '',
      room: '',
    });
    setEditSlotModal(true);
  };

  // Open modal to Edit an existing class slot
  const handleEditSlot = (slot) => {
    const yr = slot.year || getSlotYear(slot) || '1';
    const dept = slot.department || getSlotDept(slot) || '';
    setSlotForm({
      _id: slot._id,
      day: slot.day,
      period: slot.period,
      selectedPeriods: [slot.period],
      span: 1,
      className: slot.className || '',
      department: dept,
      year: yr,
      facultyId: slot.facultyId?._id || slot.facultyId || '',
      topic: slot.topic || '',
      room: slot.room || '',
    });
    setEditSlotModal(true);
  };

  // Real-time Faculty Conflict Checker: Check if selected staff is ALREADY booked anywhere in that period!
  const facultyConflictInfo = useMemo(() => {
    if (!slotForm.facultyId || !slotForm.day) return null;
    const periodsToCheck =
      slotForm.selectedPeriods && slotForm.selectedPeriods.length > 0
        ? slotForm.selectedPeriods
        : [slotForm.period];

    for (const p of periodsToCheck) {
      const conflictSlot = slots.find((s) => {
        const matchFaculty =
          s.facultyId &&
          String(s.facultyId._id || s.facultyId) === String(slotForm.facultyId);
        const matchDay = s.day === slotForm.day;
        const matchPeriod = s.period === p;
        // If editing an existing slot with _id, ignore itself
        const isSelf = slotForm._id && String(s._id) === String(slotForm._id);
        // If same className on same day & period, it's updating this class
        const isSameClass =
          slotForm.className &&
          s.className &&
          s.className.trim().toUpperCase() === slotForm.className.trim().toUpperCase();
        return matchFaculty && matchDay && matchPeriod && !isSelf && !isSameClass;
      });

      if (conflictSlot) {
        const fac = faculties.find((f) => String(f._id) === String(slotForm.facultyId));
        return {
          facultyName: fac?.name || conflictSlot.facultyName || 'This staff member',
          assignedClass: conflictSlot.className,
          department: conflictSlot.department,
          year: conflictSlot.year,
          day: slotForm.day,
          period: p,
        };
      }
    }
    return null;
  }, [slotForm, slots, faculties]);


  // Save Slot (supports single or multiple period assignment with conflict validation)
  const handleSaveSlot = async (e, overrideReassign = false) => {
    if (e) e.preventDefault();

    const periodsToSave =
      slotForm.selectedPeriods && slotForm.selectedPeriods.length > 0
        ? slotForm.selectedPeriods
        : [slotForm.period];

    if (facultyConflictInfo && !overrideReassign) {
      // Prompt interactive Reassign / Change Staff modal instead of a blocking error toast!
      const fac = faculties.find((f) => String(f._id) === String(slotForm.facultyId));
      setReassignModal({
        isOpen: true,
        faculty: fac || { name: facultyConflictInfo.facultyName, _id: slotForm.facultyId },
        conflictSlot: {
          className: facultyConflictInfo.assignedClass,
          department: facultyConflictInfo.department,
          year: facultyConflictInfo.year,
          day: facultyConflictInfo.day,
          period: facultyConflictInfo.period,
        },
        day: slotForm.day,
        period: facultyConflictInfo.period,
        targetClass: slotForm.className,
        targetDept: slotForm.department,
        targetYear: slotForm.year,
        pendingPayload: {
          slotId: slotForm._id || undefined,
          ...slotForm,
          periods: periodsToSave,
          reassignStaff: true,
        },
      });
      return;
    }

    try {
      setEditSlotModal(false);

      await saveTimeTableSlot({
        slotId: slotForm._id || undefined,
        ...slotForm,
        periods: periodsToSave,
        reassignStaff: !!overrideReassign,
      });

      toast.success(
        `Saved ${slotForm.className} for ${slotForm.day} (${periodsToSave.map((p) => `P${p}`).join(', ')})!`
      );
      fetchData(false);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.details) {
        const d = err.response.data.details;
        setReassignModal({
          isOpen: true,
          faculty: { name: d.facultyName, _id: slotForm.facultyId },
          conflictSlot: {
            className: d.assignedClass,
            department: d.department,
            year: d.year,
            day: d.day,
            period: d.period,
          },
          day: d.day,
          period: d.period,
          targetClass: slotForm.className,
          targetDept: slotForm.department,
          targetYear: slotForm.year,
          pendingPayload: {
            slotId: slotForm._id || undefined,
            ...slotForm,
            periods: periodsToSave,
            reassignStaff: true,
          },
        });
      } else {
        toast.error(err.response?.data?.message || 'Failed to save slot');
      }
      fetchData(false);
    }
  };

  // Confirm Reassign / Change Staff from Modal
  const handleConfirmReassign = async () => {
    if (!reassignModal.pendingPayload) return;
    try {
      const payload = reassignModal.pendingPayload;
      const staffName = reassignModal.faculty?.name || 'Staff';
      const targetClass = reassignModal.targetClass;
      const day = reassignModal.day;
      const period = reassignModal.period;

      setReassignModal((prev) => ({ ...prev, isOpen: false }));
      if (editSlotModal) setEditSlotModal(false);

      await saveTimeTableSlot(payload);

      toast.success(
        `✓ Reassigned ${staffName} to "${targetClass}" on ${day} Period ${period}!`,
        { duration: 5000 }
      );
      fetchData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reassign staff');
      fetchData(false);
    }
  };

  // Clear Slot
  const handleClearSlot = async () => {
    try {
      if (slotForm._id) {
        setSlots((prev) => prev.filter((s) => s._id !== slotForm._id));
        setEditSlotModal(false);
        await clearTimeTableSlot(slotForm._id);
        toast.success(`Cleared ${slotForm.className || 'slot'} from ${slotForm.day} Period ${slotForm.period}`);
        fetchData(false);
      } else {
        setEditSlotModal(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear slot');
      fetchData(false);
    }
  };

  // Drag & Drop Handlers
  // 1. Drag start from left Faculty Tray
  const handleDragStart = (e, faculty) => {
    setDraggedCell(null);
    setDraggedFaculty(faculty);
    e.dataTransfer.setData('text/plain', faculty._id);
  };

  // 2. Drag start directly from an existing Table Cell (to shift or swap periods)
  const handleCellDragStart = (e, day, period, slot) => {
    setDraggedFaculty(null);
    setDraggedCell({ day, period, slot });
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'CELL', day, period }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, day, period) => {
    e.preventDefault();
    setDragOverCell(`${day}-${period}`);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = async (e, day, period) => {
    e.preventDefault();
    setDragOverCell(null);

    // CASE 1: Dragged from another cell in the table (Shift or Swap)
    if (draggedCell) {
      const { day: sourceDay, period: sourcePeriod, slot: sourceSlot } = draggedCell;

      // If dropped onto the exact same cell, do nothing
      if (sourceDay === day && sourcePeriod === period) {
        setDraggedCell(null);
        return;
      }

      const targetExisting = getSlotAt(day, period);

      // Optimistic update for instant visual feedback without reload or jump
      setSlots((prev) => {
        const next = [...prev];
        const srcIdx = next.findIndex((s) => s.day === sourceDay && s.period === sourcePeriod);
        const tgtIdx = next.findIndex((s) => s.day === day && s.period === period);

        if (targetExisting && targetExisting.className) {
          if (srcIdx >= 0 && tgtIdx >= 0) {
            const temp = { ...next[srcIdx], day, period };
            next[srcIdx] = { ...next[tgtIdx], day: sourceDay, period: sourcePeriod };
            next[tgtIdx] = temp;
          }
        } else {
          if (srcIdx >= 0) {
            const moved = { ...next[srcIdx], day, period };
            if (tgtIdx >= 0) {
              next[tgtIdx] = moved;
            } else {
              next.push(moved);
            }
            next[srcIdx] = {
              ...next[srcIdx],
              className: '',
              facultyId: null,
              facultyName: '',
              topic: '',
              room: '',
            };
          }
        }
        return next;
      });

      try {
        if (targetExisting && targetExisting.className) {
          // SWAP two occupied cells!
          await Promise.all([
            saveTimeTableSlot({
              day,
              period,
              periods: [period],
              className: sourceSlot.className,
              department: sourceSlot.department,
              year: sourceSlot.year,
              facultyId: sourceSlot.facultyId?._id || sourceSlot.facultyId,
              topic: sourceSlot.topic,
              room: sourceSlot.room,
            }),
            saveTimeTableSlot({
              day: sourceDay,
              period: sourcePeriod,
              periods: [sourcePeriod],
              className: targetExisting.className,
              department: targetExisting.department,
              year: targetExisting.year,
              facultyId: targetExisting.facultyId?._id || targetExisting.facultyId,
              topic: targetExisting.topic,
              room: targetExisting.room,
            }),
          ]);

          toast.success(
            `Swapped ${sourceSlot.className} (${sourceDay} P${sourcePeriod}) ⇄ ${targetExisting.className} (${day} P${period})!`
          );
        } else {
          // SHIFT / MOVE cell to empty target!
          await saveTimeTableSlot({
            day,
            period,
            periods: [period],
            className: sourceSlot.className,
            department: sourceSlot.department,
            year: sourceSlot.year,
            facultyId: sourceSlot.facultyId?._id || sourceSlot.facultyId,
            topic: sourceSlot.topic,
            room: sourceSlot.room,
          });

          // Clear source slot
          if (sourceSlot._id) {
            await clearTimeTableSlot(sourceSlot._id);
          } else {
            await saveTimeTableSlot({
              day: sourceDay,
              period: sourcePeriod,
              periods: [sourcePeriod],
              className: '',
              facultyId: null,
              topic: '',
              room: '',
            });
          }

          toast.success(
            `Shifted ${sourceSlot.className} (${sourceSlot.facultyName || 'Class'}) from ${sourceDay} P${sourcePeriod} → ${day} P${period}!`
          );
        }

        fetchData(false);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to shift slot');
        fetchData(false);
      } finally {
        setDraggedCell(null);
      }
      return;
    }

    // CASE 2: Dragged from Faculty Tray (Assign faculty to slot)
    if (draggedFaculty) {
      // Find visible slots at this cell
      const visibleSlots = getVisibleSlotsAt(day, period);
      const initialDept = selectedDeptFilter !== 'ALL' ? selectedDeptFilter : draggedFaculty.department;
      const initialYear = selectedYearFilter !== 'ALL' ? selectedYearFilter : '1';
      const roman = initialYear === '1' ? 'I' : initialYear === '2' ? 'II' : initialYear === '3' ? 'III' : 'IV';
      const defaultTargetClass = `${roman}- ${initialDept}`;

      const targetSlot = visibleSlots.length === 1 ? visibleSlots[0] : null;
      const targetClass = targetSlot ? targetSlot.className : defaultTargetClass;
      const targetDept = targetSlot?.department || initialDept;
      const targetYear = targetSlot?.year || initialYear;

      // 1. Check if newly assigning staff is ALREADY assigned to this exact slot
      if (
        targetSlot &&
        targetSlot.facultyId &&
        String(targetSlot.facultyId._id || targetSlot.facultyId) === String(draggedFaculty._id)
      ) {
        toast.success(
          `${draggedFaculty.name} is already assigned to ${targetClass} on ${day} Period ${period}.`
        );
        setDraggedFaculty(null);
        return;
      }

      // 2. CRITICAL VERIFICATION: Verify that newly assigning staff does NOT have an assigned class on that period on that day
      const conflict = slots.find((s) => {
        const matchFaculty =
          s.facultyId &&
          String(s.facultyId._id || s.facultyId) === String(draggedFaculty._id);
        const matchDay = s.day === day;
        const matchPeriod = s.period === period;
        const isTargetSlot = targetSlot && String(s._id) === String(targetSlot._id);
        const isSameClass =
          s.className &&
          targetClass &&
          s.className.trim().toUpperCase() === targetClass.trim().toUpperCase();

        return matchFaculty && matchDay && matchPeriod && !isTargetSlot && !isSameClass;
      });

      if (conflict) {
        // Newly assigning staff ALREADY has an assigned class on that period on that day elsewhere!
        setReassignModal({
          isOpen: true,
          mode: 'REASSIGN_FROM_OTHER_CLASS',
          faculty: draggedFaculty,
          conflictSlot: conflict,
          day,
          period,
          targetClass,
          targetDept,
          targetYear,
          existingStaffName: targetSlot?.facultyName || '',
          pendingPayload: {
            slotId: targetSlot?._id || undefined,
            day,
            period,
            periods: [period],
            className: targetClass,
            department: targetDept,
            year: targetYear,
            facultyId: draggedFaculty._id,
            topic: draggedFaculty.specialization || targetSlot?.topic || '',
            room: targetSlot?.room || '',
            reassignStaff: true,
          },
        });
        setDraggedFaculty(null);
        return;
      }

      // 3. Verified: Newly assigning staff has NO assigned class in this period.
      // If target slot already has a DIFFERENT staff member assigned, ask if user wants to change staff:
      if (targetSlot && targetSlot.facultyId && targetSlot.facultyName) {
        setReassignModal({
          isOpen: true,
          mode: 'REPLACE_CLASS_STAFF',
          faculty: draggedFaculty,
          conflictSlot: null,
          day,
          period,
          targetClass,
          targetDept,
          targetYear,
          existingStaffName: targetSlot.facultyName,
          pendingPayload: {
            slotId: targetSlot._id,
            day,
            period,
            periods: [period],
            className: targetClass,
            department: targetDept,
            year: targetYear,
            facultyId: draggedFaculty._id,
            topic: draggedFaculty.specialization || targetSlot.topic || '',
            room: targetSlot.room || '',
            reassignStaff: true,
          },
        });
        setDraggedFaculty(null);
        return;
      }

      // 4. Staff is verified free and target slot has no staff or is empty: open modal to confirm
      setSlotForm({
        _id: targetSlot?._id || null,
        day,
        period,
        selectedPeriods: [period],
        span: 1,
        className: targetClass,
        department: targetDept,
        year: targetYear,
        facultyId: draggedFaculty._id,
        topic: draggedFaculty.specialization || targetSlot?.topic || '',
        room: targetSlot?.room || '',
      });
      setEditSlotModal(true);
      setDraggedFaculty(null);
      return;
    }
  };

  // Reset to Default Template
  const handleResetDefault = async () => {
    if (!window.confirm('Reset Time Table to the official college template shown on the printed sheet?')) {
      return;
    }
    try {
      await resetDefaultTimeTable();
      toast.success('Time Table successfully restored to official template!');
      fetchData(false);
    } catch {
      toast.error('Failed to reset time table');
    }
  };

  // Print Official Table
  const handlePrint = () => {
    window.print();
  };

  // Faculty CRUD Handlers
  const handleOpenAddFaculty = () => {
    setEditingFacultyId(null);
    setFacultyForm({
      name: '',
      facultyCode: `FAC-${Date.now().toString().slice(-4)}`,
      department: 'CSE',
      designation: 'Assistant Professor',
      email: '',
      phone: '',
      specialization: '',
      color: '#0284c7',
    });
    setFacultyModal(true);
  };

  const handleOpenEditFaculty = (fac) => {
    setEditingFacultyId(fac._id);
    setFacultyForm({
      name: fac.name,
      facultyCode: fac.facultyCode || '',
      department: fac.department || 'CSE',
      designation: fac.designation || 'Assistant Professor',
      email: fac.email || '',
      phone: fac.phone || '',
      specialization: fac.specialization || '',
      color: fac.color || '#0284c7',
    });
    setFacultyModal(true);
  };

  const handleSaveFaculty = async (e) => {
    e.preventDefault();
    try {
      if (editingFacultyId) {
        await updateFaculty(editingFacultyId, facultyForm);
        toast.success('Faculty updated successfully!');
      } else {
        await createFaculty(facultyForm);
        toast.success('New faculty member added!');
      }
      setFacultyModal(false);
      fetchData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save faculty');
    }
  };

  const handleDeleteFaculty = async (fac) => {
    if (!window.confirm(`Delete faculty "${fac.name}"? They will be unassigned from time table slots.`)) {
      return;
    }
    try {
      await deleteFaculty(fac._id);
      toast.success('Faculty removed');
      fetchData(false);
    } catch {
      toast.error('Failed to delete faculty');
    }
  };

  // Filtered faculties
  const filteredFaculties = useMemo(() => {
    return faculties.filter((f) => {
      const matchDept = selectedDeptFilter === 'ALL' || f.department === selectedDeptFilter;
      const matchSearch =
        !facultySearch ||
        f.name.toLowerCase().includes(facultySearch.toLowerCase()) ||
        (f.specialization && f.specialization.toLowerCase().includes(facultySearch.toLowerCase())) ||
        (f.facultyCode && f.facultyCode.toLowerCase().includes(facultySearch.toLowerCase()));
      return matchDept && matchSearch;
    });
  }, [faculties, selectedDeptFilter, facultySearch]);

  // Filtered workloads for Tab 3 (Image 1 fix)
  const filteredWorkloads = useMemo(() => {
    return workloads.filter((w) => {
      const matchDept = workloadDeptFilter === 'ALL' || w.department === workloadDeptFilter;
      const matchSearch =
        !workloadSearch ||
        w.name.toLowerCase().includes(workloadSearch.toLowerCase()) ||
        (w.specialization && w.specialization.toLowerCase().includes(workloadSearch.toLowerCase())) ||
        (w.facultyCode && w.facultyCode.toLowerCase().includes(workloadSearch.toLowerCase()));
      return matchDept && matchSearch;
    });
  }, [workloads, workloadDeptFilter, workloadSearch]);

  // Overall Statistics
  const totalAssignedPeriods = useMemo(() => {
    return slots.reduce((sum, s) => (s.className ? sum + (s.span || 1) : sum), 0);
  }, [slots]);

  // Dynamic daily & weekly totals based on currently visible/filtered slots
  const { visibleDayTotals, visibleTotalPeriods } = useMemo(() => {
    const dayCounts = { MON: 0, TUE: 0, WED: 0, THU: 0, FRI: 0, SAT: 0 };
    let total = 0;

    DAYS.forEach((day) => {
      PERIODS.forEach((period) => {
        const matchingSlots = getVisibleSlotsAt(day, period);
        dayCounts[day] += matchingSlots.length;
        total += matchingSlots.length;
      });
    });

    return { visibleDayTotals: dayCounts, visibleTotalPeriods: total };
  }, [getVisibleSlotsAt]);

  if (initialLoading) return <Loader />;

  return (
    <div className="ft-page-container">
      {/* Top Banner & Header */}
      <div className="ft-header-banner">
        <div className="ft-header-top" style={{ marginBottom: activeTab === 'timetable' ? 0 : undefined }}>
          <div className="ft-title-area">
            <h1>
              {activeTab === 'dashboard' ? (
                <>
                  <HiOutlineAcademicCap style={{ color: '#0284c7' }} />
                  Placement Event & Training Dashboard
                </>
              ) : activeTab === 'timetable' ? (
                <>
                  <HiOutlineCalendar style={{ color: '#0284c7' }} />
                  Placement Time Table (Interactive Grid)
                </>
              ) : activeTab === 'faculties' ? (
                <>
                  <HiOutlineUserGroup style={{ color: '#0284c7' }} />
                  Placement Faculty Directory ({faculties.length})
                </>
              ) : (
                <>
                  <HiOutlineChartBar style={{ color: '#0284c7' }} />
                  Workload & Periods Analytics
                </>
              )}
            </h1>
            <p>
              {activeTab === 'dashboard'
                ? 'Central operational dashboard for placement training schedules, faculty workload allocations, and department hours.'
                : activeTab === 'timetable'
                ? 'Official 7-period placement class time table. Drag & drop faculty onto schedule slots and update class topics.'
                : activeTab === 'faculties'
                ? 'Manage placement faculty members, department designations, contact details, and teaching allocations.'
                : 'Monitor weekly period distribution, faculty load balance, department quotas, and teaching period limits.'}
            </p>
          </div>

          <div className="ft-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {activeTab === 'dashboard' ? (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/placement-events')}
                  title="Schedule a new placement event or training session"
                >
                  <HiOutlinePlus /> Schedule Training / Event
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/placement-timetable')}
                  title="Placement Time Table"
                >
                  <HiOutlineCalendar /> Placement Time Table
                </button>
                <button className="btn btn-secondary" onClick={handlePrint} title="Print official timetable notice">
                  <HiOutlinePrinter /> Print Official Sheet
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={handlePrint} title="Print official timetable notice">
                  <HiOutlinePrinter /> Print Official Sheet
                </button>
                {activeTab === 'timetable' && (
                  <button className="btn btn-secondary" onClick={handleResetDefault} title="Restore printed photo template">
                    <HiOutlineRefresh /> Reset to Template
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleOpenAddFaculty}>
                  <HiOutlinePlus /> Add New Faculty
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Statistics Overview - Enhanced with Event & Training metrics on Dashboard */}
        {activeTab !== 'timetable' && (
          <div className="ft-stats-row">
            {activeTab === 'dashboard' ? (
              <>
                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>
                    <HiOutlineSparkles />
                  </div>
                  <div>
                    <div className="ft-stat-num">
                      {eventStats.upcoming}{' '}
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>/ {eventStats.total}</span>
                    </div>
                    <div className="ft-stat-label">Upcoming Trainings & Events</div>
                  </div>
                </div>

                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <HiOutlineUserGroup />
                  </div>
                  <div>
                    <div className="ft-stat-num">{eventStats.totalRegistered}</div>
                    <div className="ft-stat-label">Enrolled Students</div>
                  </div>
                </div>

                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(147, 51, 234, 0.1)', color: '#9333ea' }}>
                    <HiOutlineCheck />
                  </div>
                  <div>
                    <div className="ft-stat-num">{eventStats.attendanceRate}%</div>
                    <div className="ft-stat-label">Overall Attendance</div>
                  </div>
                </div>

                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                    <HiOutlineClock />
                  </div>
                  <div>
                    <div className="ft-stat-num">{totalAssignedPeriods}</div>
                    <div className="ft-stat-label">Weekly Training Periods</div>
                  </div>
                </div>

                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                    <HiOutlineAcademicCap />
                  </div>
                  <div>
                    <div className="ft-stat-num">{faculties.length}</div>
                    <div className="ft-stat-label">Placement Faculty & Staff</div>
                  </div>
                </div>

                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <HiOutlineOfficeBuilding />
                  </div>
                  <div>
                    <div className="ft-stat-num">8</div>
                    <div className="ft-stat-label">Engineering Departments</div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }}>
                    <HiOutlineClock />
                  </div>
                  <div>
                    <div className="ft-stat-num">{totalAssignedPeriods}</div>
                    <div className="ft-stat-label">Total Assigned Periods / Wk</div>
                  </div>
                </div>

                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <HiOutlineUserGroup />
                  </div>
                  <div>
                    <div className="ft-stat-num">{faculties.length}</div>
                    <div className="ft-stat-label">Active Placement Faculties</div>
                  </div>
                </div>

                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed' }}>
                    <HiOutlineBookOpen />
                  </div>
                  <div>
                    <div className="ft-stat-num">
                      {faculties.length > 0 ? (totalAssignedPeriods / faculties.length).toFixed(1) : 0}
                    </div>
                    <div className="ft-stat-label">Avg Periods / Faculty</div>
                  </div>
                </div>

                <div className="ft-stat-card">
                  <div className="ft-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <HiOutlineOfficeBuilding />
                  </div>
                  <div>
                    <div className="ft-stat-num">8</div>
                    <div className="ft-stat-label">Engineering Departments</div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* DASHBOARD: PLACEMENT EVENT & TRAINING OPERATIONAL DASHBOARD               */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <div className="training-dashboard-view" style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.25s ease' }}>
          
          {/* SECTION 1: LIVE TRAINING PROGRAMS & UPCOMING PLACEMENT EVENTS */}
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Header with Title, Search, and Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(197, 158, 81, 0.15)', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
                    <HiOutlineSparkles />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      Active Training Programs & Industry Masterclasses
                    </h2>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                      Scheduled corporate trainer modules, technical workshops, and live student attendance rosters.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/placement-events')}
                  style={{ gap: '6px' }}
                >
                  <HiOutlineCalendar /> View Full Roster ({events.length})
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/placement-events')}
                  style={{ gap: '6px' }}
                >
                  <HiOutlinePlus /> Schedule Event / Training
                </button>
              </div>
            </div>

            {/* Filter Pills and Search */}
            <div className="ft-dashboard-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              {/* Category Filter Pills */}
              <div className="ft-dashboard-cat-pills" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: `All (${events.length})` },
                  { id: 'Training', label: `Trainings (${events.filter(e => e.eventType?.toLowerCase().includes('training')).length})` },
                  { id: 'Workshop', label: `Workshops (${events.filter(e => e.eventType === 'Workshop').length})` },
                  { id: 'Bootcamp', label: `Bootcamps (${events.filter(e => e.eventType === 'Bootcamp').length})` },
                  { id: 'Guest Lecture', label: `Guest Lectures (${events.filter(e => e.eventType === 'Guest Lecture').length})` },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDashboardEventCategory(cat.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '16px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: dashboardEventCategory === cat.id ? '1px solid #0b1d37' : '1px solid #cbd5e1',
                      background: dashboardEventCategory === cat.id ? '#0b1d37' : '#ffffff',
                      color: dashboardEventCategory === cat.id ? '#ffffff' : '#475569',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px', flex: 1, maxWidth: '360px' }}>
                <div className="search-box" style={{ width: '100%', background: '#ffffff' }}>
                  <HiOutlineSearch style={{ color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search by topic, trainer, venue..."
                    value={dashboardEventSearch}
                    onChange={(e) => setDashboardEventSearch(e.target.value)}
                    className="search-input"
                    style={{ fontSize: '0.82rem' }}
                  />
                  {dashboardEventSearch && (
                    <button
                      onClick={() => setDashboardEventSearch('')}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                    >
                      <HiOutlineX />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Events Grid */}
            {filteredDashboardEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📅</div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  No Training Events Found
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 14px' }}>
                  No training sessions or masterclasses match your current search filters.
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setDashboardEventCategory('all');
                    setDashboardEventSearch('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="ft-dashboard-events-grid" style={{ gap: '18px' }}>
                {oneRowDashboardEvents.map((evt) => {
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

                  const isTrainingType =
                    evt.eventType?.toLowerCase().includes('training') ||
                    evt.eventType === 'Bootcamp' ||
                    evt.eventType === 'Workshop';

                  return (
                    <div
                      key={evt._id}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)';
                      }}
                    >
                      {/* Header with Date Badge & Title */}
                      <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'flex-start', gap: '12px', borderBottom: '1px solid #f1f5f9' }}>
                        <div
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            padding: '6px 10px',
                            textAlign: 'center',
                            minWidth: isMultiDay ? '64px' : '54px',
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#0b1d37', letterSpacing: '0.5px' }}>
                            {monthStr}
                          </span>
                          <span style={{ display: 'block', fontSize: isMultiDay ? '1.05rem' : '1.2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                            {isMultiDay ? `${dayStr}–${endDayStr}` : dayStr}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 600, color: '#64748b' }}>
                            {yearStr}
                          </span>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ ...getDashboardEventTypeStyle(evt.eventType), fontSize: '0.66rem', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                              {evt.eventType}
                            </span>
                            <span
                              style={{
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: evt.status === 'Completed' ? '#ecfdf5' : '#fef3c7',
                                color: evt.status === 'Completed' ? '#059669' : '#b45309',
                                border: evt.status === 'Completed' ? '1px solid #a7f3d0' : '1px solid #fde68a',
                              }}
                            >
                              {evt.status}
                            </span>
                            {isMultiDay && (
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  fontWeight: 800,
                                  padding: '2px 7px',
                                  borderRadius: '6px',
                                  background: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                🗓️ {evt.durationDays ? `${evt.durationDays} Days / ${evt.durationDays >= 6 ? Math.round(evt.durationDays / 6) + ' Wk' : evt.durationDays + 'D'}` : 'Multi-Day'}
                              </span>
                            )}
                          </div>
                          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
                            {evt.title}
                          </h4>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                        {/* Resource Person Spotlight */}
                        <div
                          style={{
                            background: 'linear-gradient(135deg, rgba(11, 29, 55, 0.03), rgba(197, 158, 81, 0.08))',
                            border: '1px solid rgba(197, 158, 81, 0.3)',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}
                        >
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #0b1d37, #c59e51)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.9rem',
                              flexShrink: 0,
                            }}
                          >
                            {evt.chiefGuest
                              ? evt.chiefGuest
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : 'RP'}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: 'block', fontSize: '0.62rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                              {isTrainingType ? '⭐ Resource Person / Trainer' : '⭐ Chief Guest / Speaker'}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.86rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {evt.chiefGuest}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {evt.chiefGuestDesignation || 'Invited Industry Expert'}
                              {evt.chiefGuestCompany ? ` • ${evt.chiefGuestCompany}` : ''}
                            </span>
                          </div>
                        </div>

                        {/* Date, Time & Venue */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.78rem', color: '#475569' }}>
                          {isMultiDay && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 600 }}>
                              <HiOutlineCalendar style={{ color: '#d97706', fontSize: '0.95rem' }} />
                              <span>{dateRangeLabel} ({evt.durationDays || 'Multi'} Days Program)</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <HiOutlineClock style={{ color: '#0284c7', fontSize: '0.95rem' }} />
                            <span>{isMultiDay ? <strong>Daily: </strong> : null}{evt.startTime} – {evt.endTime || 'Wrap up'}</span>
                          </div>
                          {isMultiDay && evt.dailyTimingNote && (
                            <div style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', paddingLeft: '22px' }}>
                              ℹ️ {evt.dailyTimingNote}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <HiOutlineLocationMarker style={{ color: '#0284c7', fontSize: '0.95rem' }} />
                            <span><strong>Venue:</strong> {evt.venue}</span>
                          </div>
                        </div>

                        {/* Eligible Departments */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {evt.departments?.slice(0, 6).map((dept) => (
                            <span
                              key={dept}
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: '#f1f5f9',
                                color: '#475569',
                              }}
                            >
                              {dept}
                            </span>
                          ))}
                          {evt.departments?.length > 6 && (
                            <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                              +{evt.departments.length - 6} more
                            </span>
                          )}
                        </div>

                        {/* Attendance Tracker */}
                        <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: 'auto' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                            <span>Live Attendance</span>
                            <span>{present} / {total} Attended ({pct}%)</span>
                          </div>
                          <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div style={{ padding: '10px 18px', background: '#fafafa', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate('/placement-events')}
                          style={{ fontSize: '0.76rem', padding: '5px 10px' }}
                        >
                          <HiOutlinePencilAlt /> Edit / Details
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate('/placement-events')}
                          style={{ fontSize: '0.76rem', padding: '5px 12px', gap: '5px' }}
                        >
                          <HiOutlineUserGroup /> Attendance ({total})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: WEEKLY SCHEDULE LOAD & DEPARTMENT BREAKDOWN */}
          <div className="ft-dashboard-analytics-grid" style={{ gap: '20px' }}>
            {/* Weekly Daily Load Card */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  📅 Weekly Training Load by Day
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  6 Active Training Days
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', flex: 1 }}>
                {DAYS.map((day) => {
                  const count = visibleDayTotals[day] || 0;
                  const maxPeriods = 20;
                  const pct = Math.min(100, Math.round((count / maxPeriods) * 100));
                  return (
                    <div
                      key={day}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '16px 14px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>{day}</span>
                      <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0284c7', lineHeight: 1 }}>{count}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Periods</span>
                      <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Department Breakdown Card */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  🏛️ Training Periods by Department
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7' }}>
                  {totalAssignedPeriods} Total Periods
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DEPARTMENTS.filter((d) => d !== 'ALL').map((dept) => {
                  const deptPeriods = slots.filter((s) => s.department === dept).reduce((sum, s) => sum + (s.span || 1), 0);
                  const deptFaculties = faculties.filter((f) => f.department === dept).length;
                  const pct = totalAssignedPeriods > 0 ? Math.round((deptPeriods / totalAssignedPeriods) * 100) : 0;
                  return (
                    <div key={dept} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{dept} ({deptFaculties} Faculty)</span>
                        <span style={{ color: '#0284c7' }}>{deptPeriods} Periods ({pct}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 3: QUICK-LAUNCH OPERATIONAL MODULES */}
          <div className="ft-dashboard-quick-launch-grid" style={{ gap: '16px' }}>
            {/* Card 1: Time Table Grid */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    <HiOutlineCalendar />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '10px' }}>
                    {totalAssignedPeriods} Periods
                  </span>
                </div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  Placement Time Table
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Interactive 7-period weekly placement matrix across I, II, III & IV Year engineering branches.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/placement-timetable')}
                style={{ marginTop: '14px', width: '100%', justifyContent: 'center', gap: '6px' }}
              >
                Open Time Table Grid <HiOutlineArrowRight />
              </button>
            </div>

            {/* Card 2: Faculty Directory */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    <HiOutlineUserGroup />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '10px' }}>
                    {faculties.length} Faculty
                  </span>
                </div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  Faculty Directory
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Placement training faculty coordinators, specializations, contacts, and departmental teaching assignments.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/faculty-directory')}
                style={{ marginTop: '14px', width: '100%', justifyContent: 'center', gap: '6px' }}
              >
                View Faculty Directory <HiOutlineArrowRight />
              </button>
            </div>

            {/* Card 3: Workload & Analytics */}
            <div
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                padding: '20px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f5f3ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    <HiOutlineChartBar />
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#ede9fe', color: '#5b21b6', padding: '2px 8px', borderRadius: '10px' }}>
                    {(totalAssignedPeriods / (faculties.length || 1)).toFixed(1)} Avg / Staff
                  </span>
                </div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>
                  Workload & Periods Analytics
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  Period distribution across engineering departments, load balancing, and overload detection.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => navigate('/workload-analytics')}
                style={{ marginTop: '14px', width: '100%', justifyContent: 'center', gap: '6px' }}
              >
                Open Workload Analytics <HiOutlineArrowRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: INTERACTIVE TIME TABLE (EXACT OFFICIAL UI)                         */}
      {/* ========================================================================= */}
      {activeTab === 'timetable' && (
        <div className="ft-timetable-workspace">
          {/* Draggable Faculty Tray */}
          <div className="ft-drag-tray-wrapper">
            <div className="ft-drag-tray">
              <div className="ft-drag-tray-header">
                <div className="ft-drag-tray-title">
                  <span>Faculty Palette</span>
                  <span className="ft-fac-badge">{filteredFaculties.length}</span>
                </div>
                <p className="ft-drag-tray-desc">
                  Drag any faculty card onto the timetable slots to assign!
                </p>
              </div>

              {/* Quick Filter inside tray */}
              <div style={{ marginBottom: '10px', flexShrink: 0 }}>
                <div className="search-bar" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                  <HiOutlineSearch />
                  <input
                    type="text"
                    placeholder="Filter faculty..."
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div className="ft-drag-faculty-list">
                {filteredFaculties.map((fac) => {
                  const facWl = workloads.find((w) => String(w.facultyId) === String(fac._id));
                  const weekPeriods = facWl ? facWl.totalWeekPeriods : 0;

                  return (
                    <div
                      key={fac._id}
                      className="ft-draggable-faculty-card"
                      draggable
                      onDragStart={(e) => handleDragStart(e, fac)}
                      title="Drag and drop onto any timetable cell"
                    >
                      <div className="ft-fac-avatar" style={{ background: fac.color || '#0284c7' }}>
                        {fac.name
                          .split(' ')
                          .filter((p) => !['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'].includes(p))
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'F'}
                      </div>

                      <div className="ft-fac-info">
                        <div className="ft-fac-name">{fac.name}</div>
                        <div className="ft-fac-sub">
                          <span className="ft-fac-badge">{fac.department}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {fac.specialization?.slice(0, 16) || 'Placement'}
                          </span>
                        </div>
                      </div>

                      <span className="ft-fac-periods-badge" title="Total periods assigned this week">
                        {weekPeriods}P/wk
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.74rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                💡 <strong>Tip:</strong> Click on any timetable slot to directly edit or add topics.
              </div>
            </div>
          </div>

          {/* Institutional Printed Table Sheet */}
          <div className="ft-sheet-container">
            {/* Filter Bar above official table: Year & Dept Filters */}
            <div className="ft-filters-card">
              {/* Row 1: Year Filter */}
              <div className="ft-filter-row">
                <span className="ft-filter-label">
                  <HiOutlineAcademicCap style={{ color: '#0284c7', fontSize: '1.1rem' }} /> Year Filter:
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {YEAR_OPTIONS.map((y) => {
                    const isYearActive = selectedYearFilter === y.id;
                    const count =
                      y.id === 'ALL'
                        ? slots.filter((s) => s.className).length
                        : slots.filter((s) => s.className && getSlotYear(s) === y.id).length;

                    return (
                      <button
                        key={y.id}
                        type="button"
                        className={`ft-year-btn ${isYearActive ? 'active' : ''}`}
                        onClick={() => setSelectedYearFilter(y.id)}
                      >
                        <span>{y.label}</span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '1px 6px',
                            borderRadius: '10px',
                            background: isYearActive ? 'rgba(255,255,255,0.28)' : '#e2e8f0',
                            color: isYearActive ? '#ffffff' : '#475569',
                            fontWeight: 800,
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Department Filter & Faculty Highlight */}
              <div className="ft-filter-row" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="ft-filter-label">
                    <HiOutlineFilter style={{ color: '#0284c7', fontSize: '1.1rem' }} /> Dept Filter:
                  </span>
                  {DEPARTMENTS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`ft-dept-btn ${selectedDeptFilter === d ? 'active' : ''}`}
                      onClick={() => setSelectedDeptFilter(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                {/* Highlight Faculty Dropdown & Reset Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Highlight Faculty:</span>
                  <select
                    value={selectedFacultyFilter}
                    onChange={(e) => setSelectedFacultyFilter(e.target.value)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.78rem',
                      background: '#ffffff',
                      color: '#0f172a',
                    }}
                  >
                    <option value="">All Faculties</option>
                    {faculties.map((f) => (
                      <option key={f._id} value={f.name}>
                        {f.name} ({f.department})
                      </option>
                    ))}
                  </select>

                  {(selectedYearFilter !== 'ALL' || selectedDeptFilter !== 'ALL' || selectedFacultyFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedYearFilter('ALL');
                        setSelectedDeptFilter('ALL');
                        setSelectedFacultyFilter('');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '4px 8px', color: '#ef4444' }}
                      title="Clear all filters"
                    >
                      <HiOutlineX /> Reset
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Official College Header from Image */}
            <div className="ft-sheet-header">
              <div className="ft-sheet-trust">Theni Melapettai Hindu Nadargal Uravinmurai</div>
              <div className="ft-sheet-college-name">
                NADAR SARASWATHI COLLEGE OF ENGINEERING & TECHNOLOGY
              </div>
              <div className="ft-sheet-affiliations">
                Approved by AICTE, New Delhi | Affiliated to Anna University, Chennai<br />
                Accredited by NAAC with &quot;A&quot; Grade | Recognized under Section 2(f) of the UGC Act, 1956<br />
                An ISO 9001:2015 Certified Institution<br />
                Vadapudupatti, Annanji (PO), Theni – 625 531
              </div>

              <div className="ft-sheet-title-banner">
                <div className="ft-sheet-acad-year">Academic Year - 2026-2027 (ODD SEM)</div>
                <div className="ft-sheet-sub-title">
                  {getDynamicSheetTitle()}
                </div>
              </div>
            </div>

            {/* The Official Grid Table */}
            <div className="ft-table-wrapper">
              <table className="ft-official-table">
                <colgroup>
                  <col style={{ width: '90px' }} />
                  <col style={{ width: 'calc((100% - 90px) / 7)' }} />
                  <col style={{ width: 'calc((100% - 90px) / 7)' }} />
                  <col style={{ width: 'calc((100% - 90px) / 7)' }} />
                  <col style={{ width: 'calc((100% - 90px) / 7)' }} />
                  <col style={{ width: 'calc((100% - 90px) / 7)' }} />
                  <col style={{ width: 'calc((100% - 90px) / 7)' }} />
                  <col style={{ width: 'calc((100% - 90px) / 7)' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="ft-th-day">Day/Hours</th>
                    {PERIODS.map((p) => (
                      <th key={p} className="ft-th-hour">
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day}>
                      {/* Day Label */}
                      <td className="ft-td-day-label">{day}</td>

                      {/* Periods 1 to 7: Merged into unified block when same faculty takes continuous class, otherwise separate */}
                      {PERIODS.map((period) => {
                        const visibleSlots = getVisibleSlotsAt(day, period);
                        const isDragOver = dragOverCell === `${day}-${period}`;

                        return (
                          <td
                            key={period}
                            className={`ft-table-cell ${isDragOver ? 'drag-over' : ''}`}
                            onDragOver={(e) => handleDragOver(e, day, period)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day, period)}
                          >
                            {visibleSlots.length > 0 ? (
                              <div className="ft-period-slots-stack">
                                {visibleSlots.map((slot) => {
                                  const slotYear = getSlotYear(slot);
                                  const yearRoman =
                                    slotYear === '1' ? 'I' : slotYear === '2' ? 'II' : slotYear === '3' ? 'III' : slotYear === '4' ? 'IV' : (slot.year || '');

                                  return (
                                    <div
                                      key={slot._id || `${slot.day}-${slot.period}-${slot.className}`}
                                      className="ft-period-slot-item"
                                      draggable
                                      onDragStart={(e) => {
                                        e.stopPropagation();
                                        handleCellDragStart(e, day, period, slot);
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditSlot(slot);
                                      }}
                                      title={`Click to edit ${slot.className} (${slot.facultyName || 'No Faculty Assigned'})`}
                                    >
                                      <div className="ft-slot-item-header">
                                        <span className={`ft-cell-year-badge yr-${slotYear || '1'}`}>
                                          Yr {yearRoman} ({slotYear === '1' ? '1st' : slotYear === '2' ? '2nd' : slotYear === '3' ? '3rd' : '4th'})
                                        </span>
                                        <span className="ft-slot-class-title">{slot.className}</span>
                                      </div>
                                      {slot.facultyName && (
                                        <div className="ft-slot-faculty-chip" title={slot.facultyName}>
                                          👤 {slot.facultyName}
                                        </div>
                                      )}
                                      {slot.topic && (
                                        <div className="ft-slot-topic-text" title={`Topic: ${slot.topic}`}>
                                          📖 {slot.topic}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                <button
                                  type="button"
                                  className="ft-cell-add-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAddSlot(day, period);
                                  }}
                                  title={`Add another department class on ${day} Period ${period}`}
                                >
                                  + Add Dept
                                </button>
                              </div>
                            ) : (
                              <div
                                className="ft-cell-empty"
                                onClick={() => handleOpenAddSlot(day, period)}
                                title={`Click to add class on ${day} Period ${period}`}
                              >
                                {isDragOver ? 'Drop to Assign' : '+ Click to Add'}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Daily Period Count Summary Row */}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td style={{ background: '#f1f5f9', fontSize: '0.8rem', color: '#0f172a' }}>
                      TOTAL HRS
                    </td>
                    <td colSpan={7} style={{ textAlign: 'left', padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '0.82rem', color: '#334155' }}>
                        {DAYS.map((d) => (
                          <span key={d}>
                            <strong>{d}:</strong> {visibleDayTotals[d] || 0} Periods
                          </span>
                        ))}
                        <span style={{ color: '#0284c7', marginLeft: 'auto', fontWeight: 800 }}>
                          Weekly Total: {visibleTotalPeriods} Periods
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Note & Legend footer matching official institutional document */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px dashed #cbd5e1',
                fontSize: '0.75rem',
                color: '#64748b',
              }}
            >
              <div>
                <strong>Departments:</strong> CSE, IT, AIDS, ECE, EEE, MECH, CE | <strong>Batches:</strong> II Year, III Year & IV Year
              </div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>
                Verified by: Placement Officer / Principal
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: FACULTY DIRECTORY & MANAGEMENT                                     */}
      {/* ========================================================================= */}
      {activeTab === 'faculties' && (
        <div>
          {/* Search & Dept Filter */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="search-bar" style={{ minWidth: '280px' }}>
                <HiOutlineSearch />
                <input
                  type="text"
                  placeholder="Search faculty name, code, specialization..."
                  value={facultySearch}
                  onChange={(e) => setFacultySearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDeptFilter(d)}
                    className={`btn ${selectedDeptFilter === d ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleOpenAddFaculty}>
              <HiOutlinePlus /> Add New Faculty
            </button>
          </div>

          {/* Faculty Cards Grid */}
          <div className="ft-directory-grid">
            {filteredFaculties.map((fac) => {
              const facWl = workloads.find((w) => String(w.facultyId) === String(fac._id));
              const weekPeriods = facWl ? facWl.totalWeekPeriods : 0;
              const assigned = facWl?.assignedClasses || [];

              return (
                <div key={fac._id} className="ft-faculty-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div className="ft-fac-avatar" style={{ width: '44px', height: '44px', fontSize: '1rem', background: fac.color || '#0284c7' }}>
                          {fac.name
                            .split(' ')
                            .filter((p) => !['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'].includes(p))
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'F'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                            {fac.name}
                          </h3>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {fac.designation}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(2, 132, 199, 0.1)',
                          color: '#0284c7',
                        }}
                      >
                        {fac.department}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <strong>Specialization:</strong> {fac.specialization || 'Placement Training & Assessment'}
                    </div>

                    {fac.email && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        ✉️ {fac.email}
                      </div>
                    )}
                    {fac.phone && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        📞 {fac.phone}
                      </div>
                    )}

                    {/* Assigned Classes Quick Pills */}
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Assigned Classes ({assigned.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {assigned.length > 0 ? (
                          assigned.map((cls, idx) => (
                            <span
                              key={idx}
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                background: 'rgba(0, 0, 0, 0.04)',
                                border: '1px solid var(--border-color)',
                                fontWeight: 600,
                              }}
                              title={`${cls.day} P${cls.period}: ${cls.topic || 'General'}`}
                            >
                              {cls.day} P{cls.period}: {cls.className}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No classes assigned yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '18px',
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0284c7' }}>
                      {weekPeriods} Periods / Week
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEditFaculty(fac)}
                        title="Edit faculty"
                      >
                        <HiOutlinePencilAlt /> Edit
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDeleteFaculty(fac)}
                        title="Delete faculty"
                        style={{ color: '#ef4444' }}
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORKLOAD & PERIODS ANALYTICS                                       */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TAB 3: WORKLOAD & PERIODS ANALYTICS (CRYSTAL CLEAR UI - IMAGE 1 FIX)      */}
      {/* ========================================================================= */}
      {activeTab === 'workload' && (
        <div>
          <div className="ft-workload-table-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Faculty Workload Distribution (Day-wise & Week-wise)
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Detailed monitoring of periods assigned per day and overall weekly teaching commitment.
                </p>
              </div>

              <button className="btn btn-secondary btn-sm" onClick={() => fetchData(false)}>
                <HiOutlineRefresh /> Refresh Workload
              </button>
            </div>

            {/* Workload Department Filter & Search Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                marginBottom: '16px',
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                  <HiOutlineFilter style={{ verticalAlign: 'middle' }} /> Dept:
                </span>
                {DEPARTMENTS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setWorkloadDeptFilter(d)}
                    className={`ft-dept-btn ${workloadDeptFilter === d ? 'active' : ''}`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="search-bar" style={{ padding: '6px 12px', fontSize: '0.82rem', width: '230px' }}>
                <HiOutlineSearch />
                <input
                  type="text"
                  placeholder="Search faculty..."
                  value={workloadSearch}
                  onChange={(e) => setWorkloadSearch(e.target.value)}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
            </div>

            {/* Clear Workload Table with Day Columns */}
            <div style={{ overflowX: 'auto' }}>
              <table className="ft-workload-table">
                <thead>
                  <tr>
                    <th style={{ width: '220px', minWidth: '220px' }}>Faculty Name</th>
                    <th style={{ width: '100px', minWidth: '100px', textAlign: 'center' }}>Department</th>
                    <th style={{ width: '170px', minWidth: '170px' }}>Designation</th>
                    <th className="ft-wl-th-day">MON</th>
                    <th className="ft-wl-th-day">TUE</th>
                    <th className="ft-wl-th-day">WED</th>
                    <th className="ft-wl-th-day">THU</th>
                    <th className="ft-wl-th-day">FRI</th>
                    <th className="ft-wl-th-day">SAT</th>
                    <th className="ft-wl-th-total">WEEK TOTAL</th>
                    <th style={{ width: '120px', minWidth: '120px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkloads.map((w) => {
                    const total = w.totalWeekPeriods;
                    let badge = { text: 'Optimal', bg: '#dcfce7', color: '#15803d', dot: '#16a34a' };
                    if (total === 0) badge = { text: 'Unassigned', bg: '#f1f5f9', color: '#64748b', dot: '#94a3b8' };
                    else if (total < 4) badge = { text: 'Light Load', bg: '#fef3c7', color: '#b45309', dot: '#d97706' };
                    else if (total >= 10) badge = { text: 'High Load', bg: '#fee2e2', color: '#b91c1c', dot: '#dc2626' };

                    return (
                      <tr key={w.facultyId}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: w.color || '#0284c7',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.78rem',
                                flexShrink: 0,
                              }}
                            >
                              {w.name
                                .split(' ')
                                .filter((p) => !['Dr.', 'Prof.', 'Mr.', 'Mrs.', 'Ms.'].includes(p))
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase() || 'F'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                                {w.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {w.specialization || w.facultyCode}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '5px',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              background: 'rgba(2, 132, 199, 0.1)',
                              color: '#0284c7',
                            }}
                          >
                            {w.department}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {w.designation}
                        </td>

                        {DAYS.map((d) => {
                          const count = w.dayBreakdown[d] || 0;
                          return (
                            <td key={d} className="ft-wl-td-day">
                              {count > 0 ? (
                                <span className="ft-wl-day-badge">{count}</span>
                              ) : (
                                <span className="ft-wl-day-dash">–</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="ft-wl-td-total">
                          <span className="ft-wl-total-badge">
                            {total} {total === 1 ? 'Period' : 'Periods'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span
                            className="ft-status-pill"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            <span className="ft-status-dot" style={{ background: badge.dot }} />
                            {badge.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Summary Totals Row */}
                  <tr className="ft-wl-summary-row">
                    <td colSpan={3} style={{ textAlign: 'right', paddingRight: '16px', letterSpacing: '0.5px' }}>
                      TOTAL PERIODS PER DAY:
                    </td>
                    {DAYS.map((d) => (
                      <td key={d} className="ft-wl-td-day" style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.9rem' }}>
                        {dayTotals[d] || 0}
                      </td>
                    ))}
                    <td className="ft-wl-td-total" style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.95rem' }}>
                      {totalAssignedPeriods} Periods
                    </td>
                    <td style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                      Weekly Total
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT / TOUCH TIMETABLE CELL                                      */}
      {/* ========================================================================= */}
      {editSlotModal && (
        <div className="ft-modal-overlay" onClick={() => setEditSlotModal(false)}>
          <div className="ft-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ft-modal-header">
              <h3 className="ft-modal-title">
                <HiOutlinePencilAlt style={{ color: '#0284c7' }} />
                Edit Class Slot: {slotForm.day} - Period {slotForm.period}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setEditSlotModal(false)}
                style={{ padding: '4px 8px' }}
              >
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleSaveSlot}>
              <div className="ft-modal-body">
                {/* Year of Study */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Year of Study *
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { id: '1', label: '1st Year (I)' },
                      { id: '2', label: '2nd Year (II)' },
                      { id: '3', label: '3rd Year (III)' },
                      { id: '4', label: '4th Year (IV)' },
                    ].map((yr) => {
                      const isSel = String(slotForm.year) === yr.id;
                      return (
                        <button
                          key={yr.id}
                          type="button"
                          onClick={() => {
                            setSlotForm({ ...slotForm, year: yr.id });
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: isSel ? '2px solid #0284c7' : '1px solid var(--border-color)',
                            background: isSel ? '#0284c7' : 'var(--bg-main, #f8fafc)',
                            color: isSel ? '#ffffff' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                          }}
                        >
                          {yr.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Class / Department / Year */}
                <div className="form-group">
                  <label className="form-label">Class Name / Department *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. I- CSE, II- IT, III- EEE, IV- CSE"
                    value={slotForm.className}
                    onChange={(e) => {
                      const val = e.target.value;
                      const y = getSlotYear({ className: val }) || slotForm.year;
                      const d = getSlotDept({ className: val }) || slotForm.department;
                      setSlotForm({ ...slotForm, className: val, year: y, department: d });
                    }}
                    required
                  />
                  <div style={{ marginTop: '8px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Quick presets for Year {slotForm.year || '2'}:
                  </div>
                  <div className="ft-quick-tags">
                    {(QUICK_CLASSES_BY_YEAR[slotForm.year] || ALL_QUICK_CLASSES).map((qc) => (
                      <button
                        type="button"
                        key={qc}
                        className="ft-tag-btn"
                        onClick={() => {
                          const y = getSlotYear({ className: qc }) || slotForm.year;
                          const d = getSlotDept({ className: qc });
                          setSlotForm({
                            ...slotForm,
                            className: qc,
                            year: y,
                            department: d || slotForm.department,
                          });
                        }}
                      >
                        {qc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assigned Faculty */}
                <div className="form-group">
                  <label className="form-label">Assigned Faculty</label>
                  <select
                    className="form-select"
                    value={slotForm.facultyId}
                    onChange={(e) => setSlotForm({ ...slotForm, facultyId: e.target.value })}
                  >
                    <option value="">-- No Faculty Assigned --</option>
                    {faculties.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.department} - {f.designation})
                      </option>
                    ))}
                  </select>

                  {/* Real-time Faculty Conflict Alert Banner */}
                  {facultyConflictInfo && (
                    <div className="ft-conflict-alert-box">
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>⚠️</span>
                        <div>
                          <div style={{ fontWeight: 800, color: '#b91c1c', fontSize: '0.9rem', marginBottom: '4px' }}>
                            Period Collision Warning: Staff Already Assigned!
                          </div>
                          <div style={{ fontSize: '0.84rem', color: '#7f1d1d', lineHeight: 1.45 }}>
                            <strong>{facultyConflictInfo.facultyName}</strong> is already assigned to{' '}
                            <span style={{ background: '#fee2e2', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, color: '#991b1b', border: '1px solid #fca5a5' }}>
                              {facultyConflictInfo.assignedClass}
                            </span>{' '}
                            in <strong>{facultyConflictInfo.department} Department</strong> on{' '}
                            <strong>{facultyConflictInfo.day} Period {facultyConflictInfo.period}</strong>.
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: '6px', fontWeight: 600 }}>
                            A staff member cannot teach two classes in the same period. Reassigning will move {facultyConflictInfo.facultyName} here and unassign them from {facultyConflictInfo.assignedClass}:
                          </div>
                          <button
                            type="button"
                            className="ft-conflict-reassign-btn"
                            onClick={() => handleSaveSlot(null, true)}
                          >
                            <HiOutlineSwitchHorizontal /> Reassign {facultyConflictInfo.facultyName} to This Class
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Topic to teach */}
                <div className="form-group">
                  <label className="form-label">What Topic They Teach for This Class *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Data Structures, Aptitude, Embedded Systems, Python"
                    value={slotForm.topic}
                    onChange={(e) => setSlotForm({ ...slotForm, topic: e.target.value })}
                  />
                  <div style={{ marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Suggested syllabus topics:
                  </div>
                  <div className="ft-quick-tags">
                    {QUICK_TOPICS.map((qt) => (
                      <button
                        type="button"
                        key={qt}
                        className="ft-tag-btn"
                        onClick={() => setSlotForm({ ...slotForm, topic: qt })}
                      >
                        {qt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-Period Assignment Toggle */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Select Periods to Assign on {slotForm.day}:
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {PERIODS.map((p) => {
                      const isSelected = slotForm.selectedPeriods?.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            const current = slotForm.selectedPeriods || [];
                            let updated;
                            if (current.includes(p)) {
                              if (current.length === 1) return; // Keep at least 1
                              updated = current.filter((x) => x !== p);
                            } else {
                              updated = [...current, p].sort((a, b) => a - b);
                            }
                            setSlotForm({ ...slotForm, selectedPeriods: updated });
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid #0284c7' : '1px solid var(--border-color)',
                            background: isSelected ? '#0284c7' : 'var(--bg-main, #f8fafc)',
                            color: isSelected ? '#ffffff' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected ? `✓ Period ${p}` : `Period ${p}`}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Tip: Select multiple periods (e.g. 1 & 2 or 5, 6, 7) if the same faculty teaches a multi-hour session. Each period remains its own separate cell in the grid!
                  </div>
                </div>

                {/* Room / Lab */}
                <div className="form-group">
                  <label className="form-label">Venue / Room / Lab</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Placement Lab 1, Audi, Room 204"
                    value={slotForm.room}
                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                  />
                </div>
              </div>

              <div className="ft-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClearSlot}
                  style={{ color: '#ef4444' }}
                >
                  <HiOutlineTrash /> Clear Slot
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditSlotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      background: facultyConflictInfo
                        ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                        : undefined,
                    }}
                    title={
                      facultyConflictInfo
                        ? 'Click to review & confirm reassigning staff'
                        : 'Save Slot'
                    }
                  >
                    {facultyConflictInfo ? (
                      <>
                        <HiOutlineSwitchHorizontal /> Reassign & Save Slot
                      </>
                    ) : (
                      <>
                        <HiOutlineCheck /> Save & Sync Slot
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD / EDIT FACULTY                                               */}
      {/* ========================================================================= */}
      {facultyModal && (
        <div className="ft-modal-overlay" onClick={() => setFacultyModal(false)}>
          <div className="ft-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ft-modal-header">
              <h3 className="ft-modal-title">
                <HiOutlineAcademicCap style={{ color: '#0284c7' }} />
                {editingFacultyId ? 'Edit Faculty Details' : 'Add New Faculty Member'}
              </h3>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setFacultyModal(false)}
                style={{ padding: '4px 8px' }}
              >
                <HiOutlineX />
              </button>
            </div>

            <form onSubmit={handleSaveFaculty}>
              <div className="ft-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Dr. K. Ramesh"
                      value={facultyForm.name}
                      onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Faculty ID / Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="FAC-001"
                      value={facultyForm.facultyCode}
                      onChange={(e) => setFacultyForm({ ...facultyForm, facultyCode: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <select
                      className="form-select"
                      value={facultyForm.department}
                      onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                    >
                      {DEPARTMENTS.filter((d) => d !== 'ALL').map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Assistant Professor, Lead Trainer"
                      value={facultyForm.designation}
                      onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Primary Specialization / Topic Domain</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Data Structures, Aptitude, Soft Skills, IoT"
                    value={facultyForm.specialization}
                    onChange={(e) => setFacultyForm({ ...facultyForm, specialization: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="faculty@nscet.edu.in"
                      value={facultyForm.email}
                      onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="10-digit number"
                      value={facultyForm.phone}
                      onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Color Accent Badge</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={facultyForm.color}
                      onChange={(e) => setFacultyForm({ ...facultyForm, color: e.target.value })}
                      style={{ width: '45px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Used for drag & drop cards and timetable highlights
                    </span>
                  </div>
                </div>
              </div>

              <div className="ft-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFacultyModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <HiOutlineCheck /> {editingFacultyId ? 'Update Faculty' : 'Save Faculty Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REASSIGN / CHANGE STAFF CONFIRMATION DIALOG                     */}
      {/* ========================================================================= */}
      {reassignModal.isOpen && (
        <div className="ft-modal-overlay" onClick={() => setReassignModal((p) => ({ ...p, isOpen: false }))}>
          <div
            className="ft-modal-card ft-reassign-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ft-reassign-header">
              <div className="ft-reassign-icon-circle">
                <HiOutlineSwitchHorizontal />
              </div>
              <div>
                <h3 className="ft-modal-title" style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                  {reassignModal.mode === 'REPLACE_CLASS_STAFF'
                    ? `Change Staff for ${reassignModal.targetClass}?`
                    : 'Change Staff Assignment?'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  {reassignModal.mode === 'REPLACE_CLASS_STAFF'
                    ? `Assign ${reassignModal.faculty?.name} to this class on ${reassignModal.day} Period ${reassignModal.period}`
                    : `${reassignModal.faculty?.name} already has a class on ${reassignModal.day} Period ${reassignModal.period}`}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReassignModal((p) => ({ ...p, isOpen: false }))}
                style={{ padding: '4px 8px', marginLeft: 'auto' }}
              >
                <HiOutlineX />
              </button>
            </div>

            <div className="ft-modal-body" style={{ gap: '16px', padding: '20px 22px' }}>
              <div className="ft-reassign-question">
                {reassignModal.mode === 'REPLACE_CLASS_STAFF' ? (
                  <>
                    Do you want to change the staff for{' '}
                    <span className="ft-class-highlight">{reassignModal.targetClass}</span> from{' '}
                    <strong>{reassignModal.existingStaffName || 'Current Staff'}</strong> to{' '}
                    <strong>{reassignModal.faculty?.name}</strong>?
                  </>
                ) : (
                  <>
                    Do you want to change / reassign <strong>{reassignModal.faculty?.name}</strong> to{' '}
                    <span className="ft-class-highlight">{reassignModal.targetClass}</span> instead?
                  </>
                )}
              </div>

              {/* Comparison flow box */}
              <div className="ft-reassign-comparison">
                {/* Current assignment box */}
                <div className="ft-reassign-box ft-reassign-box-from">
                  <div className="ft-reassign-box-label">
                    <span className="ft-reassign-status-badge from">
                      {reassignModal.mode === 'REPLACE_CLASS_STAFF' ? 'Current Staff' : 'Currently Assigned'}
                    </span>
                    <span className="ft-reassign-action-badge">
                      {reassignModal.mode === 'REPLACE_CLASS_STAFF' ? 'Will be Replaced' : 'Will be Cleared'}
                    </span>
                  </div>
                  <div className="ft-reassign-class-name">
                    {reassignModal.mode === 'REPLACE_CLASS_STAFF'
                      ? reassignModal.targetClass
                      : (reassignModal.conflictSlot?.className || 'Existing Class')}
                  </div>
                  <div className="ft-reassign-meta">
                    <span>
                      🏢{' '}
                      {reassignModal.mode === 'REPLACE_CLASS_STAFF'
                        ? reassignModal.targetDept
                        : (reassignModal.conflictSlot?.department || 'Dept')}{' '}
                      Dept
                    </span>
                    <span>⏰ {reassignModal.day} Period {reassignModal.period}</span>
                  </div>
                  <div className="ft-reassign-staff-tag">
                    👤{' '}
                    {reassignModal.mode === 'REPLACE_CLASS_STAFF'
                      ? (reassignModal.existingStaffName || 'Current Staff')
                      : reassignModal.faculty?.name}
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="ft-reassign-arrow">
                  <HiOutlineArrowDown />
                  <span>
                    {reassignModal.mode === 'REPLACE_CLASS_STAFF' ? 'Change to' : 'Reassign / Move to'}
                  </span>
                </div>

                {/* Target assignment box */}
                <div className="ft-reassign-box ft-reassign-box-to">
                  <div className="ft-reassign-box-label">
                    <span className="ft-reassign-status-badge to">
                      {reassignModal.mode === 'REPLACE_CLASS_STAFF' ? 'New Assigned Staff' : 'New Target Class'}
                    </span>
                    <span className="ft-reassign-action-badge to">Will be Assigned</span>
                  </div>
                  <div className="ft-reassign-class-name">
                    {reassignModal.targetClass}
                  </div>
                  <div className="ft-reassign-meta">
                    <span>🏢 {reassignModal.targetDept || 'Dept'} Dept</span>
                    <span>⏰ {reassignModal.day} Period {reassignModal.period}</span>
                  </div>
                  <div className="ft-reassign-staff-tag to">
                    👤 {reassignModal.faculty?.name}
                  </div>
                </div>
              </div>

              <div className="ft-reassign-notice">
                {reassignModal.mode === 'REPLACE_CLASS_STAFF' ? (
                  <>
                    ✅ <strong>Verified Free:</strong> <strong>{reassignModal.faculty?.name}</strong> has no other assigned class on {reassignModal.day} Period {reassignModal.period}. Confirming will assign them to <strong>{reassignModal.targetClass}</strong>.
                  </>
                ) : (
                  <>
                    ⚠️ <strong>Rule:</strong> A staff member cannot teach two classes in the same period. Confirming will unassign <strong>{reassignModal.faculty?.name}</strong> from <strong>{reassignModal.conflictSlot?.className}</strong> and assign them to <strong>{reassignModal.targetClass}</strong>.
                  </>
                )}
              </div>
            </div>

            <div
              className="ft-modal-footer"
              style={{
                padding: '16px 22px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setReassignModal((p) => ({ ...p, isOpen: false }))}
              >
                Cancel / Keep Current
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmReassign}
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <HiOutlineSwitchHorizontal /> Yes, Change Staff Here
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyTimetablePage;
