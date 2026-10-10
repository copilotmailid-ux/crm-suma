import { useState, useEffect, useCallback, useMemo } from 'react';
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

const FacultyTimetablePage = () => {
  const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' | 'faculties' | 'workload'
  const [initialLoading, setInitialLoading] = useState(true);
  const [slots, setSlots] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [workloads, setWorkloads] = useState([]);
  const [dayTotals, setDayTotals] = useState({});

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

  // Fetch data (isInitial = true only on initial component mount)
  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    try {
      const [facRes, ttRes, wlRes] = await Promise.all([
        getFaculties(),
        getTimeTable(),
        getWorkloadAnalytics(),
      ]);
      setFaculties(facRes.data || []);
      setSlots(ttRes.data || []);
      setWorkloads(wlRes.data?.workloads || []);
      setDayTotals(wlRes.data?.totalDayPeriods || {});
    } catch {
      toast.error('Failed to load Faculty & Time Table data');
    } finally {
      if (isInitial) setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Lookup helper for slot at [day, period]
  const getSlotAt = useCallback(
    (day, period) => {
      return slots.find((s) => s.day === day && s.period === period);
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

  // Return the slot only if it matches current filter; otherwise null (so other years are completely hidden, not low opacity!)
  const getVisibleSlotAt = useCallback(
    (day, period) => {
      const slot = getSlotAt(day, period);
      if (!slot || !slot.className) return null;
      if (isSlotMatchingFilter(slot)) {
        return slot;
      }
      return null;
    },
    [getSlotAt, isSlotMatchingFilter]
  );

  // Helper: check if this period is the start of a continuous block with the same faculty
  const getContinuousBlockSpan = useCallback(
    (day, period) => {
      const slot = getVisibleSlotAt(day, period);
      // Empty slot is always single period
      if (!slot || !slot.className || !slot.facultyName) return 1;

      // If preceded by a visible slot with the exact same class and faculty on the same day, this period is covered
      if (period > 1) {
        const prev = getVisibleSlotAt(day, period - 1);
        if (prev && prev.className === slot.className && prev.facultyName === slot.facultyName) {
          return 0; // Covered by earlier starting period!
        }
      }

      // This is the start of a continuous block! Count how many consecutive periods share the same class & faculty
      let count = 1;
      for (let p = period + 1; p <= 7; p++) {
        const next = getVisibleSlotAt(day, p);
        if (next && next.className === slot.className && next.facultyName === slot.facultyName) {
          count++;
        } else {
          break;
        }
      }
      return count;
    },
    [getVisibleSlotAt]
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

  // Cell Click / Touch to Edit
  const handleCellClick = (day, period) => {
    // In filtered view, if there is a visible slot for this year/dept, edit it; otherwise create new slot for selected year/dept
    const existing = getVisibleSlotAt(day, period);

    // Find adjacent periods on this day that share the exact same class and faculty
    let activePeriods = [period];
    if (existing && existing.className) {
      for (let p = period - 1; p >= 1; p--) {
        const s = getVisibleSlotAt(day, p);
        if (s && s.className === existing.className && s.facultyName === existing.facultyName) {
          activePeriods.unshift(p);
        } else {
          break;
        }
      }
      for (let p = period + 1; p <= 7; p++) {
        const s = getVisibleSlotAt(day, p);
        if (s && s.className === existing.className && s.facultyName === existing.facultyName) {
          activePeriods.push(p);
        } else {
          break;
        }
      }
    }

    const initialYear = existing
      ? (existing.year || getSlotYear(existing) || '2')
      : (selectedYearFilter !== 'ALL' ? selectedYearFilter : '2');

    if (existing) {
      setSlotForm({
        day: existing.day,
        period: existing.period,
        selectedPeriods: activePeriods,
        className: existing.className || '',
        department: existing.department || getSlotDept(existing) || '',
        year: initialYear,
        facultyId: existing.facultyId?._id || existing.facultyId || '',
        topic: existing.topic || '',
        room: existing.room || '',
      });
    } else {
      setSlotForm({
        day,
        period,
        selectedPeriods: [period],
        className: '',
        department: selectedDeptFilter !== 'ALL' ? selectedDeptFilter : '',
        year: initialYear,
        facultyId: '',
        topic: '',
        room: '',
      });
    }
    setEditSlotModal(true);
  };

  // Save Slot (supports single or multiple period assignment)
  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      const periodsToSave =
        slotForm.selectedPeriods && slotForm.selectedPeriods.length > 0
          ? slotForm.selectedPeriods
          : [slotForm.period];

      const facultyObj = faculties.find(
        (f) => String(f._id) === String(slotForm.facultyId)
      );

      // Optimistic update so the grid updates instantly without waiting or jumping
      setSlots((prev) => {
        const next = [...prev];
        for (const p of periodsToSave) {
          const idx = next.findIndex((s) => s.day === slotForm.day && s.period === p);
          const newSlotData = {
            day: slotForm.day,
            period: p,
            span: 1,
            className: slotForm.className,
            department: slotForm.department,
            year: slotForm.year,
            facultyId: facultyObj || slotForm.facultyId,
            facultyName: facultyObj?.name || '',
            facultyColor: facultyObj?.color || '#0284c7',
            topic: slotForm.topic,
            room: slotForm.room,
          };
          if (idx >= 0) {
            next[idx] = { ...next[idx], ...newSlotData };
          } else {
            next.push(newSlotData);
          }
        }
        return next;
      });

      setEditSlotModal(false);

      await saveTimeTableSlot({
        ...slotForm,
        periods: periodsToSave,
      });

      toast.success(
        `Saved for ${slotForm.day} (${periodsToSave.map((p) => `P${p}`).join(', ')})!`
      );
      fetchData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot');
      fetchData(false);
    }
  };

  // Clear Slot (clears selected periods)
  const handleClearSlot = async () => {
    try {
      const periodsToClear =
        slotForm.selectedPeriods && slotForm.selectedPeriods.length > 0
          ? slotForm.selectedPeriods
          : [slotForm.period];

      // Optimistic clear
      setSlots((prev) =>
        prev.map((s) => {
          if (s.day === slotForm.day && periodsToClear.includes(s.period)) {
            return {
              ...s,
              className: '',
              department: '',
              year: '',
              facultyId: null,
              facultyName: '',
              topic: '',
              room: '',
            };
          }
          return s;
        })
      );

      setEditSlotModal(false);

      for (const p of periodsToClear) {
        const existing = getSlotAt(slotForm.day, p);
        if (existing && existing._id) {
          await clearTimeTableSlot(existing._id);
        }
      }
      toast.success(`Cleared slot(s) for ${slotForm.day}`);
      fetchData(false);
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
      const existing = getSlotAt(day, period);
      const updatedSlot = {
        day,
        period,
        periods: [period],
        className: existing?.className || '',
        department: existing?.department || (selectedDeptFilter !== 'ALL' ? selectedDeptFilter : draggedFaculty.department),
        year: existing?.year || (selectedYearFilter !== 'ALL' ? selectedYearFilter : '2'),
        facultyId: draggedFaculty._id,
        topic: existing?.topic || draggedFaculty.specialization || '',
        room: existing?.room || '',
      };

      // Optimistic update
      setSlots((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => s.day === day && s.period === period);
        const slotData = {
          ...existing,
          ...updatedSlot,
          facultyName: draggedFaculty.name,
          facultyColor: draggedFaculty.color,
        };
        if (idx >= 0) {
          next[idx] = slotData;
        } else {
          next.push(slotData);
        }
        return next;
      });

      try {
        await saveTimeTableSlot(updatedSlot);
        toast.success(`Assigned ${draggedFaculty.name} to ${day} Period ${period}!`);
        fetchData(false);

        // If slot didn't have a class name yet, open modal for convenience
        if (!existing?.className) {
          setSlotForm({
            ...updatedSlot,
            selectedPeriods: [period],
          });
          setEditSlotModal(true);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to assign faculty');
        fetchData(false);
      } finally {
        setDraggedFaculty(null);
      }
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
        const slot = getVisibleSlotAt(day, period);
        if (slot && slot.className) {
          dayCounts[day] = (dayCounts[day] || 0) + 1;
          total += 1;
        }
      });
    });

    return { visibleDayTotals: dayCounts, visibleTotalPeriods: total };
  }, [getVisibleSlotAt]);

  if (initialLoading) return <Loader />;

  return (
    <div className="ft-page-container">
      {/* Top Banner & Header */}
      <div className="ft-header-banner">
        <div className="ft-header-top">
          <div className="ft-title-area">
            <h1>
              <HiOutlineAcademicCap style={{ color: '#0284c7' }} />
              Faculty Management & Placement Time Table
            </h1>
            <p>
              Assign faculty across departments and classes, track daily & weekly period workload, and update topics taught in real-time.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handlePrint} title="Print official timetable notice">
              <HiOutlinePrinter /> Print Official Sheet
            </button>
            <button className="btn btn-secondary" onClick={handleResetDefault} title="Restore printed photo template">
              <HiOutlineRefresh /> Reset to Template
            </button>
            <button className="btn btn-primary" onClick={handleOpenAddFaculty}>
              <HiOutlinePlus /> Add New Faculty
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="ft-nav-tabs">
          <button
            className={`ft-tab-btn ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setActiveTab('timetable')}
          >
            <HiOutlineCalendar /> Placement Time Table (Interactive Grid)
          </button>
          <button
            className={`ft-tab-btn ${activeTab === 'faculties' ? 'active' : ''}`}
            onClick={() => setActiveTab('faculties')}
          >
            <HiOutlineUserGroup /> Faculty Directory ({faculties.length})
          </button>
          <button
            className={`ft-tab-btn ${activeTab === 'workload' ? 'active' : ''}`}
            onClick={() => setActiveTab('workload')}
          >
            <HiOutlineChartBar /> Workload & Periods Analytics
          </button>
        </div>

        {/* Quick Statistics Overview */}
        <div className="ft-stats-row">
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTERACTIVE TIME TABLE (EXACT OFFICIAL UI)                         */}
      {/* ========================================================================= */}
      {activeTab === 'timetable' && (
        <div className="ft-timetable-workspace">
          {/* Draggable Faculty Tray */}
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
            <div style={{ marginBottom: '10px' }}>
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

            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              💡 <strong>Tip:</strong> Click on any timetable slot to directly edit or add topics.
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
                        const span = getContinuousBlockSpan(day, period);
                        // If span === 0, this period is part of a continuous block that started at an earlier period
                        if (span === 0) {
                          return null;
                        }

                        const slot = getVisibleSlotAt(day, period);
                        const isDragOver = dragOverCell === `${day}-${period}`;

                        const slotYear = getSlotYear(slot);
                        const yearRoman =
                          slotYear === '1' ? 'I' : slotYear === '2' ? 'II' : slotYear === '3' ? 'III' : slotYear === '4' ? 'IV' : '';

                        return (
                          <td
                            key={period}
                            colSpan={span}
                            className={`ft-table-cell ${isDragOver ? 'drag-over' : ''} ${
                              span > 1 ? 'continuous-block' : ''
                            }`}
                            onClick={() => handleCellClick(day, period)}
                            onDragOver={(e) => handleDragOver(e, day, period)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, day, period)}
                          >
                            {slot && slot.className ? (
                              <div
                                className="ft-cell-content"
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  handleCellDragStart(e, day, period, slot);
                                }}
                                style={{
                                  cursor: 'grab',
                                  opacity:
                                    draggedCell?.day === day && draggedCell?.period === period
                                      ? 0.35
                                      : 1,
                                }}
                                title="Drag from this cell to shift/swap to another period, or click to edit"
                              >
                                <span className="ft-cell-drag-handle" title="Drag to shift period">
                                  ⋮⋮
                                </span>

                                {/* Year Pill Tag */}
                                {slotYear && (
                                  <span className={`ft-cell-year-badge yr-${slotYear}`}>
                                    Yr {yearRoman} ({slotYear === '1' ? '1st' : slotYear === '2' ? '2nd' : slotYear === '3' ? '3rd' : '4th'})
                                  </span>
                                )}

                                <div className="ft-class-name">{slot.className}</div>
                                {slot.facultyName && (
                                  <div className="ft-faculty-tag" title={slot.facultyName}>
                                    👤 {slot.facultyName}
                                  </div>
                                )}
                                {slot.topic && (
                                  <div className="ft-topic-text" title={`Topic: ${slot.topic}`}>
                                    📖 {slot.topic}
                                  </div>
                                )}
                                {slot.room && (
                                  <div style={{ fontSize: '0.62rem', color: '#64748b' }}>
                                    📍 {slot.room}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="ft-cell-empty">
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
                  <button type="submit" className="btn btn-primary">
                    <HiOutlineCheck /> Save & Sync Slot
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
    </div>
  );
};

export default FacultyTimetablePage;
