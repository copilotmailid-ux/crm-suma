import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  HiOutlineX,
  HiOutlineOfficeBuilding,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineUser,
  HiOutlineIdentification,
  HiOutlineExternalLink,
  HiOutlineSearch,
  HiOutlineTable,
  HiOutlineDocumentDownload,
  HiOutlinePrinter,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineUsers,
  HiOutlineCalendar,
  HiOutlineCurrencyRupee,
  HiOutlineLocationMarker,
  HiOutlineFilter,
} from 'react-icons/hi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { getCompany } from '../../api/companyApi';
import Loader from './Loader';

const CompanyDetailModal = ({ company, onClose, onCompanyUpdated = null }) => {
  // Lock body scroll while modal is open
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('placed'); // 'placed' | 'attended' | 'drives' | 'about'
  const [data, setData] = useState({
    company: company || {},
    stats: {
      totalPlaced: company?.studentsPlaced || 0,
      totalAttended: 0,
      totalDrives: company?.visits || 1,
      highestPackage: 0,
      averagePackage: 0,
      departmentBreakdown: {},
    },
    placedStudents: [],
    attendedStudents: [],
    drives: [],
  });

  // Master Campus Visit Segmentation: 'ALL' | 1 | 2 | 3 ...
  const [selectedVisit, setSelectedVisit] = useState('ALL');

  // Search & filter states
  const [placedSearch, setPlacedSearch] = useState('');
  const [placedDeptFilter, setPlacedDeptFilter] = useState('ALL');
  const [placedVisitFilter, setPlacedVisitFilter] = useState('ALL');

  const [attendedSearch, setAttendedSearch] = useState('');
  const [attendedDeptFilter, setAttendedDeptFilter] = useState('ALL');
  const [attendedStatusFilter, setAttendedStatusFilter] = useState('ALL');
  const [attendedVisitFilter, setAttendedVisitFilter] = useState('ALL');

  const [drivesVisitFilter, setDrivesVisitFilter] = useState('ALL');

  const [exporting, setExporting] = useState(false);

  // Fetch full company details
  const fetchDetails = useCallback(async () => {
    if (!company?._id) return;
    setLoading(true);
    try {
      const res = await getCompany(company._id);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching company details:', err);
      toast.error('Failed to load full company details');
    } finally {
      setLoading(false);
    }
  }, [company?._id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const comp = data.company || company || {};
  const stats = data.stats || {};
  const placedList = data.placedStudents || [];
  const attendedList = data.attendedStudents || [];
  const drivesList = data.drives || [];

  // Unique available campus visits across company records
  const availableVisits = useMemo(() => {
    const set = new Set();
    drivesList.forEach((d) => {
      if (d.visitNumber) set.add(Number(d.visitNumber));
    });
    placedList.forEach((s) => {
      if (s.visitNumber) set.add(Number(s.visitNumber));
    });
    attendedList.forEach((s) => {
      (s.drives || []).forEach((d) => {
        if (d.visitNumber) set.add(Number(d.visitNumber));
      });
    });
    (data.visitsList || comp.visitsList || []).forEach((v) => {
      if (v.visitNumber) set.add(Number(v.visitNumber));
    });
    const maxVisits = comp.visits || 1;
    for (let i = 1; i <= maxVisits; i++) {
      set.add(i);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [drivesList, placedList, attendedList, data.visitsList, comp.visitsList, comp.visits]);

  // Complete preserved visits list with points of contact per visit
  const visitsList = useMemo(() => {
    const raw = Array.isArray(data.visitsList) && data.visitsList.length > 0
      ? data.visitsList
      : (Array.isArray(comp.visitsList) && comp.visitsList.length > 0 ? comp.visitsList : []);

    const list = [...raw];
    availableVisits.forEach((v) => {
      if (!list.some((entry) => Number(entry.visitNumber) === Number(v))) {
        list.push({
          visitNumber: v,
          contactPerson: comp.contactPerson || 'Campus Recruitment Lead',
          contactRole: comp.contactRole || 'Campus Hiring Lead / HR Manager',
          contactEmail: comp.contactEmail || '',
          contactPhone: comp.contactPhone || '',
          location: comp.location || '',
          description: comp.description || '',
          date: comp.createdAt || new Date(),
        });
      }
    });
    return list.sort((a, b) => Number(a.visitNumber) - Number(b.visitNumber));
  }, [data.visitsList, comp, availableVisits]);

  // Active Point of Contact for the selected visit
  const activeContact = useMemo(() => {
    if (selectedVisit !== 'ALL') {
      const match = visitsList.find((v) => Number(v.visitNumber) === Number(selectedVisit));
      if (match) return match;
    }
    if (visitsList.length > 0) {
      return visitsList[visitsList.length - 1];
    }
    return {
      visitNumber: comp.visits || 1,
      contactPerson: comp.contactPerson,
      contactRole: comp.contactRole,
      contactEmail: comp.contactEmail,
      contactPhone: comp.contactPhone,
      location: comp.location,
    };
  }, [selectedVisit, visitsList, comp]);

  // Unique dept-year tags for filtering
  const placedDeptYears = useMemo(() => {
    const set = new Set();
    placedList.forEach((s) => {
      if (s.deptYearLabel) set.add(s.deptYearLabel);
    });
    return Array.from(set).sort();
  }, [placedList]);

  const attendedDeptYears = useMemo(() => {
    const set = new Set();
    attendedList.forEach((s) => {
      if (s.deptYearLabel) set.add(s.deptYearLabel);
    });
    return Array.from(set).sort();
  }, [attendedList]);

  // Filtered Placed Students
  const filteredPlaced = useMemo(() => {
    return placedList.filter((s) => {
      const matchesSearch =
        !placedSearch ||
        (s.name && s.name.toLowerCase().includes(placedSearch.toLowerCase())) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(placedSearch.toLowerCase())) ||
        (s.role && s.role.toLowerCase().includes(placedSearch.toLowerCase())) ||
        (s.deptYearLabel && s.deptYearLabel.toLowerCase().includes(placedSearch.toLowerCase()));

      const matchesDept =
        placedDeptFilter === 'ALL' || s.deptYearLabel === placedDeptFilter;

      const effectiveVisit = selectedVisit !== 'ALL' ? selectedVisit : placedVisitFilter;
      const matchesVisit =
        effectiveVisit === 'ALL' ||
        Number(s.visitNumber || 1) === Number(effectiveVisit);

      return matchesSearch && matchesDept && matchesVisit;
    });
  }, [placedList, placedSearch, placedDeptFilter, placedVisitFilter, selectedVisit]);

  // Filtered Attended Students
  const filteredAttended = useMemo(() => {
    return attendedList.filter((s) => {
      const matchesSearch =
        !attendedSearch ||
        (s.name && s.name.toLowerCase().includes(attendedSearch.toLowerCase())) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(attendedSearch.toLowerCase())) ||
        (s.highestRound && s.highestRound.toLowerCase().includes(attendedSearch.toLowerCase())) ||
        (s.deptYearLabel && s.deptYearLabel.toLowerCase().includes(attendedSearch.toLowerCase()));

      const matchesDept =
        attendedDeptFilter === 'ALL' || s.deptYearLabel === attendedDeptFilter;

      const matchesStatus =
        attendedStatusFilter === 'ALL' ||
        (attendedStatusFilter === 'PLACED' && s.isPlaced) ||
        (attendedStatusFilter === 'IN_PROGRESS' && !s.isPlaced && s.latestStatus !== 'eliminated') ||
        (attendedStatusFilter === 'ELIMINATED' && s.latestStatus === 'eliminated');

      const effectiveVisit = selectedVisit !== 'ALL' ? selectedVisit : attendedVisitFilter;
      const matchesVisit =
        effectiveVisit === 'ALL' ||
        Number(s.visitNumber || 1) === Number(effectiveVisit) ||
        (s.drives && s.drives.some((d) => Number(d.visitNumber || 1) === Number(effectiveVisit))) ||
        (!s.drives?.length && Number(effectiveVisit) === 1);

      return matchesSearch && matchesDept && matchesStatus && matchesVisit;
    });
  }, [attendedList, attendedSearch, attendedDeptFilter, attendedStatusFilter, attendedVisitFilter, selectedVisit]);

  // Filtered Drives
  const filteredDrives = useMemo(() => {
    return drivesList.filter((d) => {
      const effectiveVisit = selectedVisit !== 'ALL' ? selectedVisit : drivesVisitFilter;
      return (
        effectiveVisit === 'ALL' ||
        Number(d.visitNumber || 1) === Number(effectiveVisit)
      );
    });
  }, [drivesList, drivesVisitFilter, selectedVisit]);

  // Segment-aware KPI stats
  const displayPlacedCount = selectedVisit === 'ALL' ? (stats.totalPlaced ?? placedList.length) : filteredPlaced.length;
  const displayAttendedCount = selectedVisit === 'ALL' ? (stats.totalAttended ?? attendedList.length) : filteredAttended.length;
  const displayDrivesCount = selectedVisit === 'ALL' ? (stats.totalDrives ?? drivesList.length ?? comp.visits ?? 1) : filteredDrives.length;
  const displayHighestPackage = useMemo(() => {
    if (selectedVisit === 'ALL') {
      return stats.highestPackage ? `₹${stats.highestPackage} LPA` : (comp.package ? `₹${comp.package} LPA` : '-');
    }
    const pkgs = filteredPlaced.map((p) => Number(p.package)).filter((n) => !isNaN(n) && n > 0);
    if (pkgs.length > 0) return `₹${Math.max(...pkgs)} LPA`;
    const drivePkgs = filteredDrives.map((d) => Number(d.package)).filter((n) => !isNaN(n) && n > 0);
    if (drivePkgs.length > 0) return `₹${Math.max(...drivePkgs)} LPA`;
    return '-';
  }, [selectedVisit, stats.highestPackage, comp.package, filteredPlaced, filteredDrives]);

  // Segment-aware Department Breakdown
  const displayDeptBreakdown = useMemo(() => {
    if (selectedVisit === 'ALL') {
      return stats.departmentBreakdown || {};
    }
    const bd = {};
    filteredPlaced.forEach((p) => {
      const dept = (p.department || 'Other').toUpperCase();
      bd[dept] = (bd[dept] || 0) + 1;
    });
    return bd;
  }, [selectedVisit, stats.departmentBreakdown, filteredPlaced]);

  // ==================== REPORT GENERATION ====================

  // 1. Export Excel Report
  const handleExportExcel = () => {
    try {
      setExporting(true);
      const companyName = comp.name || 'Company';
      const wb = XLSX.utils.book_new();

      // Sheet 1: Company Overview & Contacts
      const overviewData = [
        ['PLACEMENT RECRUITMENT REPORT - ' + companyName.toUpperCase()],
        ['Generated Date', new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
        [''],
        ['COMPANY DETAILS', ''],
        ['Company Name', comp.name || ''],
        ['Industry', comp.industry || ''],
        ['Location', comp.location || 'Headquarters / Campus Relations'],
        ['Website', comp.website || '-'],
        ['Description', comp.description || '-'],
        [''],
        ['HR / RECRUITMENT CONTACT PERSON', ''],
        ['Contact Person Name', comp.contactPerson || '-'],
        ['Designation / Role', comp.contactRole || 'Campus Hiring Lead / HR Manager'],
        ['Contact Email', comp.contactEmail || '-'],
        ['Contact Phone', comp.contactPhone || '-'],
        [''],
        ['PLACEMENT STATISTICS', ''],
        ['Total Students Placed', stats.totalPlaced ?? placedList.length],
        ['Total Students Attended', stats.totalAttended ?? attendedList.length],
        ['Total Campus Drives / Visits', stats.totalDrives ?? comp.visits ?? 1],
        ['Highest Package (LPA)', stats.highestPackage ? `₹${stats.highestPackage} LPA` : '-'],
        ['Average Package (LPA)', stats.averagePackage ? `₹${stats.averagePackage} LPA` : '-'],
      ];
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      wsOverview['!cols'] = [{ wch: 30 }, { wch: 45 }];
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Company Overview');

      // Sheet 2: Placed Students
      const placedRows = placedList.map((s, idx) => ({
        'S.No': idx + 1,
        'Student Name': s.name,
        'Roll Number': s.rollNumber,
        'Dept & Year': s.deptYearLabel || `${s.department} (${s.batch})`,
        'Campus Visit': s.visitNumber ? `Visit ${s.visitNumber}` : 'Visit 1',
        'Department': s.department,
        'Batch': s.batch,
        'Job Role': s.role || 'Software Engineer',
        'Package (₹ LPA)': s.package ? `₹${s.package} LPA` : '-',
        'Placement Date': s.placementDate ? new Date(s.placementDate).toLocaleDateString('en-IN') : '-',
        'Email': s.email || '-',
        'Phone': s.phone || '-',
      }));
      const wsPlaced = XLSX.utils.json_to_sheet(placedRows.length > 0 ? placedRows : [{ 'Notice': 'No students placed recorded yet' }]);
      wsPlaced['!cols'] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 14 },
        { wch: 12 },
        { wch: 12 },
        { wch: 22 },
        { wch: 16 },
        { wch: 15 },
        { wch: 28 },
        { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(wb, wsPlaced, 'Placed Students');

      // Sheet 3: Attended Students
      const attendedRows = attendedList.map((s, idx) => ({
        'S.No': idx + 1,
        'Student Name': s.name,
        'Roll Number': s.rollNumber,
        'Dept & Year': s.deptYearLabel || `${s.department} (${s.batch})`,
        'Campus Visits': (s.drives || []).map((d) => `Visit ${d.visitNumber || 1}`).join(', ') || 'Visit 1',
        'Department': s.department,
        'Batch': s.batch,
        'CGPA': s.cgpa || '-',
        'Outcome': s.isPlaced ? 'PLACED' : s.latestStatus === 'eliminated' ? 'Eliminated' : 'Attended / In Progress',
        'Highest Stage Reached': s.highestRound || 'Registered',
        'Email': s.email || '-',
        'Phone': s.phone || '-',
      }));
      const wsAttended = XLSX.utils.json_to_sheet(attendedRows.length > 0 ? attendedRows : [{ 'Notice': 'No attended students recorded' }]);
      wsAttended['!cols'] = [
        { wch: 6 },
        { wch: 25 },
        { wch: 15 },
        { wch: 15 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 8 },
        { wch: 16 },
        { wch: 25 },
        { wch: 28 },
        { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(wb, wsAttended, 'Attended Students');

      // Sheet 4: Recruitment Drives
      if (drivesList.length > 0) {
        const driveRows = drivesList.map((d, idx) => ({
          'S.No': idx + 1,
          'Campus Visit': `Visit ${d.visitNumber || 1}`,
          'Role': d.role || '-',
          'Drive Date': d.driveDate ? new Date(d.driveDate).toLocaleDateString('en-IN') : '-',
          'Package (₹ LPA)': d.package ? `₹${d.package} LPA` : '-',
          'Min CGPA': d.minCgpa ?? 'Any',
          'Status': d.status || 'Active',
          'Rounds Count': d.rounds?.length || 0,
          'Registered': d.registeredStudents?.length || 0,
          'Placed Count': d.finalSelectedStudents?.length || 0,
        }));
        const wsDrives = XLSX.utils.json_to_sheet(driveRows);
        wsDrives['!cols'] = [
          { wch: 6 },
          { wch: 14 },
          { wch: 24 },
          { wch: 15 },
          { wch: 16 },
          { wch: 10 },
          { wch: 12 },
          { wch: 14 },
          { wch: 14 },
          { wch: 14 },
        ];
        XLSX.utils.book_append_sheet(wb, wsDrives, 'Campus Drives');
      }

      const cleanName = (comp.name || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName}_Placement_Report.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success(`Excel report downloaded: ${filename}`);
    } catch (err) {
      console.error('Error generating Excel report:', err);
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  // 2. Export Clean PDF Report
  const handleExportPDF = () => {
    try {
      setExporting(true);
      const companyName = comp.name || 'Company';
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 28, 'F');

      // Accent Gold Stripe
      doc.setFillColor(197, 158, 81); // #c59e51
      doc.rect(0, 28, pageWidth, 2, 'F');

      // College Title
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('NADAR SARASWATHI COLLEGE OF ENGINEERING & TECHNOLOGY', 14, 11);

      // Subtitle
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225);
      doc.text('CAMPUS RECRUITMENT & PLACEMENT REPORT', 14, 18);

      // Date on right
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - 14, 18, { align: 'right' });

      // Company Info Header Box
      let currentY = 38;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(companyName, 14, currentY);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Industry: ${comp.industry || 'Corporate'} | Website: ${comp.website || '-'}`, 14, currentY + 6);

      // HR Contact Box
      currentY += 12;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, 'FD');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('HR & RECRUITMENT CONTACT', 18, currentY + 6);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      const contactText = `Contact: ${comp.contactPerson || '-'}  •  Role: ${comp.contactRole || 'Campus Hiring Lead / HR'}  •  Email: ${comp.contactEmail || '-'}  •  Phone: ${comp.contactPhone || '-'}`;
      doc.text(contactText, 18, currentY + 14);

      // Quick KPI Stats Bar
      currentY += 25;
      const cardWidth = (pageWidth - 28 - 9) / 4;
      const kpis = [
        { label: 'STUDENTS PLACED', value: String(stats.totalPlaced ?? placedList.length), color: [16, 185, 129] },
        { label: 'STUDENTS ATTENDED', value: String(stats.totalAttended ?? attendedList.length), color: [59, 130, 246] },
        { label: 'CAMPUS VISITS', value: String(stats.totalDrives ?? comp.visits ?? 1), color: [197, 158, 81] },
        { label: 'HIGHEST PACKAGE', value: stats.highestPackage ? `₹${stats.highestPackage} LPA` : '-', color: [139, 92, 246] },
      ];

      kpis.forEach((kpi, i) => {
        const x = 14 + i * (cardWidth + 3);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, currentY, cardWidth, 16, 2, 2, 'FD');

        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, x + 4, currentY + 5.5);

        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
        doc.text(kpi.value, x + 4, currentY + 12.5);
      });

      currentY += 22;

      // Section: Placed Students
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Placed Students (${placedList.length})`, 14, currentY);

      const placedTableHeaders = ['#', 'Student Name', 'Roll Number', 'Dept & Year', 'Visit', 'Role Offered', 'Package', 'Placed Date'];
      const placedTableRows = placedList.map((s, idx) => [
        idx + 1,
        s.name,
        s.rollNumber,
        s.deptYearLabel || `${s.department} (${s.batch})`,
        s.visitNumber ? `Visit ${s.visitNumber}` : 'Visit 1',
        s.role || '-',
        s.package ? `₹${s.package} LPA` : '-',
        s.placementDate ? new Date(s.placementDate).toLocaleDateString('en-IN') : '-',
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [placedTableHeaders],
        body: placedTableRows.length > 0 ? placedTableRows : [['-', 'No students placed recorded', '-', '-', '-', '-', '-', '-']],
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [15, 23, 42],
        },
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { cellWidth: 22 },
          3: { cellWidth: 24, fontStyle: 'bold', textColor: [16, 185, 129] },
          4: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 32 },
          6: { cellWidth: 22, fontStyle: 'bold' },
          7: { cellWidth: 22 },
        },
        margin: { left: 14, right: 14 },
      });

      // Section: Attended Students Summary on new page or continuation
      const finalY = doc.lastAutoTable?.finalY || currentY + 40;
      if (finalY > 220) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY = finalY + 12;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`Attended Candidates (${attendedList.length})`, 14, currentY);

      const attendedTableHeaders = ['#', 'Student Name', 'Roll Number', 'Dept & Year', 'Visits', 'CGPA', 'Highest Stage Reached', 'Outcome'];
      const attendedTableRows = attendedList.map((s, idx) => [
        idx + 1,
        s.name,
        s.rollNumber,
        s.deptYearLabel || `${s.department} (${s.batch})`,
        (s.drives || []).map((d) => `Visit ${d.visitNumber || 1}`).join(', ') || 'Visit 1',
        s.cgpa || '-',
        s.highestRound || 'Registered',
        s.isPlaced ? 'PLACED' : s.latestStatus === 'eliminated' ? 'Eliminated' : 'Attended',
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [attendedTableHeaders],
        body: attendedTableRows.length > 0 ? attendedTableRows : [['-', 'No registered candidates recorded', '-', '-', '-', '-', '-', '-']],
        theme: 'striped',
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          textColor: [15, 23, 42],
        },
        headStyles: {
          fillColor: [71, 85, 105],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { fontStyle: 'bold' },
          2: { cellWidth: 22 },
          3: { cellWidth: 24, fontStyle: 'bold' },
          4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 14, halign: 'center' },
          6: { cellWidth: 35 },
          7: { cellWidth: 22, fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
      });

      const cleanName = (comp.name || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName}_Placement_Report.pdf`;
      doc.save(filename);
      toast.success(`PDF report downloaded: ${filename}`);
    } catch (err) {
      console.error('Error generating PDF report:', err);
      toast.error('Failed to export PDF report');
    } finally {
      setExporting(false);
    }
  };

  // 3. Quick Print
  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="company-detail-modal-card"
        style={{
          maxWidth: '1380px',
          width: '98%',
          height: 'calc(100vh - 24px)',
          maxHeight: '940px',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.8)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div
          style={{
            padding: '18px 24px 14px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          {/* Left: Avatar & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.35rem',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.25)',
                flexShrink: 0,
              }}
            >
              {comp.name ? comp.name.charAt(0).toUpperCase() : 'C'}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: 800,
                    color: '#0f172a',
                    margin: 0,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {comp.name}
                </h2>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}
                >
                  {comp.industry || 'Corporate Partner'}
                </span>
                <span
                  style={{
                    background: '#f8fafc',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {comp.visits || 1} Campus {comp.visits === 1 ? 'Visit' : 'Visits'}
                </span>
                {comp.website && (
                  <a
                    href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: '0.8rem',
                      color: '#64748b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#c59e51')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  >
                    <HiOutlineExternalLink /> Website
                  </a>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748b' }}>
                Placement & Campus Recruitment Profile • NSCET Placement Cell
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleExportExcel}
              disabled={exporting}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                cursor: 'pointer',
              }}
              title="Download Excel Report"
            >
              <HiOutlineTable style={{ fontSize: '1rem', color: '#16a34a' }} />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={exporting}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                cursor: 'pointer',
              }}
              title="Download PDF Report"
            >
              <HiOutlineDocumentDownload style={{ fontSize: '1rem', color: '#2563eb' }} />
              <span>PDF Report</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#1e293b',
                cursor: 'pointer',
              }}
              title="Print Summary"
            >
              <HiOutlinePrinter style={{ fontSize: '1rem' }} />
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#fee2e2',
                border: 'none',
                color: '#ef4444',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                fontSize: '1.15rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                marginLeft: '4px',
              }}
              title="Close Modal"
            >
              <HiOutlineX />
            </button>
          </div>
        </div>

        {/* ================= CAMPUS VISIT SEGMENT CONTROLLER ================= */}
        <div
          style={{
            padding: '10px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Campus Visits:
            </span>
            <button
              onClick={() => {
                setSelectedVisit('ALL');
                setPlacedVisitFilter('ALL');
                setAttendedVisitFilter('ALL');
                setDrivesVisitFilter('ALL');
              }}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: selectedVisit === 'ALL' ? 'none' : '1px solid #cbd5e1',
                background: selectedVisit === 'ALL' ? 'linear-gradient(135deg, #0f172a 0%, #334155 100%)' : '#ffffff',
                color: selectedVisit === 'ALL' ? '#ffffff' : '#475569',
                cursor: 'pointer',
                boxShadow: selectedVisit === 'ALL' ? '0 2px 8px rgba(15, 23, 42, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              All Visits ({availableVisits.length})
            </button>
            {availableVisits.map((v) => {
              const isSelected = Number(selectedVisit) === Number(v);
              return (
                <button
                  key={v}
                  onClick={() => {
                    setSelectedVisit(v);
                    setPlacedVisitFilter(v);
                    setAttendedVisitFilter(v);
                    setDrivesVisitFilter(v);
                  }}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: isSelected ? 'none' : '1px solid #cbd5e1',
                    background: isSelected
                      ? 'linear-gradient(135deg, #1e293b 0%, #2563eb 100%)'
                      : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Visit {v}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Segment Mode:</span>
            <strong style={{ color: '#0f172a' }}>
              {selectedVisit === 'ALL'
                ? `All Visits Combined (${availableVisits.length} visits)`
                : `Visit ${selectedVisit} (Isolated View)`}
            </strong>
          </div>
        </div>

        {/* ================= HR CONTACT PERSON BANNER ================= */}
        <div
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          {/* HR Contact Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c59e51',
                fontSize: '1.2rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                flexShrink: 0,
              }}
            >
              <HiOutlineIdentification />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 700 }}>
                  {selectedVisit === 'ALL' ? 'Primary Contact Person' : `Visit ${selectedVisit} • Point of Contact`}
                </span>
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '1px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {activeContact.contactRole || 'Campus Hiring Lead / HR Manager'}
                </span>
                {activeContact.visitNumber && (
                  <span
                    style={{
                      background: '#fef3c7',
                      color: '#92400e',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: '12px',
                    }}
                  >
                    Visit {activeContact.visitNumber}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                {activeContact.contactPerson || 'Not Specified'}
              </div>
            </div>
          </div>

          {/* HR Contact Right: Email & Phone */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {activeContact.contactEmail && (
              <a
                href={`mailto:${activeContact.contactEmail}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#2563eb',
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
                title="Send Email"
              >
                <HiOutlineMail style={{ fontSize: '1rem' }} />
                <span>{activeContact.contactEmail}</span>
              </a>
            )}

            {activeContact.contactPhone && (
              <a
                href={`tel:${activeContact.contactPhone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#059669',
                  textDecoration: 'none',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                }}
                title="Call Contact Person"
              >
                <HiOutlinePhone style={{ fontSize: '1rem' }} />
                <span>{activeContact.contactPhone}</span>
              </a>
            )}
          </div>
        </div>

        {/* ================= STATS SUMMARY CARDS ================= */}
        <div
          style={{
            padding: '12px 24px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          {/* Card 1: Placed Students */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}
            >
              <HiOutlineCheckCircle />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                Students Placed {selectedVisit !== 'ALL' && `(Visit ${selectedVisit})`}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d' }}>
                {displayPlacedCount}
              </div>
            </div>
          </div>

          {/* Card 2: Attended Students */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}
            >
              <HiOutlineUsers />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                Students Attended {selectedVisit !== 'ALL' && `(Visit ${selectedVisit})`}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1d4ed8' }}>
                {displayAttendedCount}
              </div>
            </div>
          </div>

          {/* Card 3: Highest Package */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#fefce8',
              border: '1px solid #fef08a',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#fef9c3',
                color: '#ca8a04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}
            >
              <HiOutlineCurrencyRupee />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' }}>
                Highest Package {selectedVisit !== 'ALL' && `(Visit ${selectedVisit})`}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#a16207' }}>
                {displayHighestPackage}
              </div>
            </div>
          </div>

          {/* Card 4: Drives / Visits */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#f3e8ff',
                color: '#9333ea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0,
              }}
            >
              <HiOutlineBriefcase />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase' }}>
                Recruitment Drives {selectedVisit !== 'ALL' && `(Visit ${selectedVisit})`}
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#7e22ce' }}>
                {displayDrivesCount}
              </div>
            </div>
          </div>
        </div>

        {/* ================= TAB NAVIGATION ================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 24px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            flexShrink: 0,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', alignItems: 'center', width: '100%', paddingBottom: '2px' }}>
            {/* Placed Students Tab */}
            <button
              onClick={() => setActiveTab('placed')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'placed'
                  ? 'linear-gradient(135deg, #1e293b 0%, #2b394f 40%, #c59e51 100%)'
                  : 'transparent',
                border: 'none',
                color: activeTab === 'placed' ? '#ffffff' : '#334155',
                fontWeight: activeTab === 'placed' ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'placed'
                  ? '0 4px 12px rgba(30, 41, 59, 0.25)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <HiOutlineCheckCircle style={{ fontSize: '1.1rem' }} />
              <span>Placed Students</span>
              <span
                style={{
                  background: activeTab === 'placed' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'placed' ? '#ffffff' : '#475569',
                  padding: '1px 7px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                {filteredPlaced.length}
              </span>
            </button>

            {/* Attended Students Tab */}
            <button
              onClick={() => setActiveTab('attended')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'attended'
                  ? 'linear-gradient(135deg, #1e293b 0%, #2b394f 40%, #c59e51 100%)'
                  : 'transparent',
                border: 'none',
                color: activeTab === 'attended' ? '#ffffff' : '#334155',
                fontWeight: activeTab === 'attended' ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'attended'
                  ? '0 4px 12px rgba(30, 41, 59, 0.25)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <HiOutlineUsers style={{ fontSize: '1.1rem' }} />
              <span>Attended Students</span>
              <span
                style={{
                  background: activeTab === 'attended' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'attended' ? '#ffffff' : '#475569',
                  padding: '1px 7px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                {filteredAttended.length}
              </span>
            </button>

            {/* Drives Tab */}
            <button
              onClick={() => setActiveTab('drives')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'drives'
                  ? 'linear-gradient(135deg, #1e293b 0%, #2b394f 40%, #c59e51 100%)'
                  : 'transparent',
                border: 'none',
                color: activeTab === 'drives' ? '#ffffff' : '#334155',
                fontWeight: activeTab === 'drives' ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'drives'
                  ? '0 4px 12px rgba(30, 41, 59, 0.25)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <HiOutlineBriefcase style={{ fontSize: '1.1rem' }} />
              <span>Campus Drives</span>
              <span
                style={{
                  background: activeTab === 'drives' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: activeTab === 'drives' ? '#ffffff' : '#475569',
                  padding: '1px 7px',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                }}
              >
                {filteredDrives.length}
              </span>
            </button>

            {/* Company About & Overview Tab */}
            <button
              onClick={() => setActiveTab('about')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '10px',
                background: activeTab === 'about'
                  ? 'linear-gradient(135deg, #1e293b 0%, #2b394f 40%, #c59e51 100%)'
                  : 'transparent',
                border: 'none',
                color: activeTab === 'about' ? '#ffffff' : '#334155',
                fontWeight: activeTab === 'about' ? 700 : 600,
                fontSize: '0.86rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'about'
                  ? '0 4px 12px rgba(30, 41, 59, 0.25)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <HiOutlineOfficeBuilding style={{ fontSize: '1.1rem' }} />
              <span>Company Info</span>
            </button>
          </div>
        </div>

        {/* ================= TAB BODY CONTENT ================= */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#f8fafc' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <Loader />
              <p style={{ marginTop: '12px', color: '#64748b', fontSize: '0.9rem' }}>Loading company records...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: PLACED STUDENTS */}
              {activeTab === 'placed' && (
                <div>
                  {/* Toolbar & Filters */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
                      <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
                        <HiOutlineSearch
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                            fontSize: '1.1rem',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Search placed students by name, roll, role..."
                          value={placedSearch}
                          onChange={(e) => setPlacedSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.86rem',
                            outline: 'none',
                            background: '#ffffff',
                          }}
                        />
                      </div>

                      {/* Dept & Year Filter Dropdown */}
                      <select
                        value={placedDeptFilter}
                        onChange={(e) => setPlacedDeptFilter(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          background: '#ffffff',
                          color: '#334155',
                          outline: 'none',
                        }}
                      >
                        <option value="ALL">All Departments & Years</option>
                        {placedDeptYears.map((dy) => (
                          <option key={dy} value={dy}>
                            {dy}
                          </option>
                        ))}
                      </select>

                      {/* Campus Visit Filter Dropdown */}
                      <select
                        value={placedVisitFilter}
                        onChange={(e) => setPlacedVisitFilter(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          background: '#ffffff',
                          color: '#334155',
                          outline: 'none',
                        }}
                      >
                        <option value="ALL">All Campus Visits</option>
                        {availableVisits.map((v) => (
                          <option key={v} value={v}>
                            Visit {v} Drives
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Showing <strong>{filteredPlaced.length}</strong> of <strong>{placedList.length}</strong> placed students
                    </div>
                  </div>

                  {/* Placed Students Table */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                  >
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                          <th>Student Name & Roll No</th>
                          <th>Department & Year</th>
                          <th style={{ textAlign: 'center' }}>Campus Visit</th>
                          <th>Role Offered</th>
                          <th style={{ textAlign: 'center' }}>Package</th>
                          <th>Placement Date</th>
                          <th style={{ textAlign: 'center' }}>Offer Letter</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlaced.length === 0 ? (
                          <tr>
                            <td colSpan={8}>
                              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                <HiOutlineAcademicCap style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '8px' }} />
                                <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 4px', color: '#334155' }}>
                                  No placed students found
                                </p>
                                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                                  {placedSearch || placedDeptFilter !== 'ALL' || placedVisitFilter !== 'ALL'
                                    ? 'Try adjusting your search query or filter.'
                                    : `No students have been recorded as placed in ${comp.name} yet.`}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredPlaced.map((s, idx) => (
                            <tr key={s.placementId ? s.placementId.toString() : `${s._id}_${s.visitNumber || 1}_${idx}`}>
                              <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                                {idx + 1}
                              </td>

                              {/* Student Name & Roll */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      background: '#f1f5f9',
                                      color: '#1e293b',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.82rem',
                                      fontWeight: 700,
                                      border: '1px solid #e2e8f0',
                                    }}
                                  >
                                    {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                      {s.name}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                                      {s.rollNumber}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Department & Year (Format: IV-CSE, IV-AI&DS, etc.) */}
                              <td>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#ecfdf5',
                                    color: '#047857',
                                    border: '1px solid #a7f3d0',
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  {s.deptYearLabel || `${s.department} (${s.batch})`}
                                </span>
                              </td>

                              {/* Campus Visit Badge */}
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  Visit {s.visitNumber || 1}
                                </span>
                              </td>

                              {/* Role */}
                              <td style={{ fontWeight: 600, color: '#1e293b' }}>
                                {s.role || 'Software Engineer'}
                              </td>

                              {/* Package */}
                              <td style={{ textAlign: 'center' }}>
                                <span
                                  className="badge badge-success"
                                  style={{
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    padding: '3px 9px',
                                  }}
                                >
                                  ₹{s.package || comp.package || '0'} LPA
                                </span>
                              </td>

                              {/* Placement Date */}
                              <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                {s.placementDate
                                  ? new Date(s.placementDate).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </td>

                              {/* Offer Letter / Details */}
                              <td style={{ textAlign: 'center' }}>
                                {s.offerLetterUrl ? (
                                  <a
                                    href={s.offerLetterUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      color: '#2563eb',
                                      background: '#eff6ff',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid #bfdbfe',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    View Letter ↗
                                  </a>
                                ) : (
                                  <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Verified</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: ATTENDED STUDENTS */}
              {activeTab === 'attended' && (
                <div>
                  {/* Toolbar & Filters */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      marginBottom: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '320px', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                        <HiOutlineSearch
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                            fontSize: '1.1rem',
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Search attended candidates by name, roll, round..."
                          value={attendedSearch}
                          onChange={(e) => setAttendedSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px 8px 36px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.86rem',
                            outline: 'none',
                            background: '#ffffff',
                          }}
                        />
                      </div>

                      {/* Dept & Year Filter Dropdown */}
                      <select
                        value={attendedDeptFilter}
                        onChange={(e) => setAttendedDeptFilter(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          background: '#ffffff',
                          color: '#334155',
                          outline: 'none',
                        }}
                      >
                        <option value="ALL">All Dept & Year</option>
                        {attendedDeptYears.map((dy) => (
                          <option key={dy} value={dy}>
                            {dy}
                          </option>
                        ))}
                      </select>

                      {/* Status Filter */}
                      <select
                        value={attendedStatusFilter}
                        onChange={(e) => setAttendedStatusFilter(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          background: '#ffffff',
                          color: '#334155',
                          outline: 'none',
                        }}
                      >
                        <option value="ALL">All Outcomes</option>
                        <option value="PLACED">Placed Candidates</option>
                        <option value="IN_PROGRESS">Attended / Shortlisted</option>
                        <option value="ELIMINATED">Eliminated</option>
                      </select>

                      {/* Campus Visit Filter */}
                      <select
                        value={attendedVisitFilter}
                        onChange={(e) => setAttendedVisitFilter(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          background: '#ffffff',
                          color: '#334155',
                          outline: 'none',
                        }}
                      >
                        <option value="ALL">All Campus Visits</option>
                        {availableVisits.map((v) => (
                          <option key={v} value={v}>
                            Visit {v} Drives
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      Showing <strong>{filteredAttended.length}</strong> of <strong>{attendedList.length}</strong> candidates
                    </div>
                  </div>

                  {/* Attended Students Table */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                  >
                    <table className="data-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                          <th>Student Name & Roll No</th>
                          <th>Department & Year</th>
                          <th style={{ textAlign: 'center' }}>CGPA</th>
                          <th>Drives & Campus Visits Participated</th>
                          <th>Highest Round / Stage</th>
                          <th style={{ textAlign: 'center' }}>Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttended.length === 0 ? (
                          <tr>
                            <td colSpan={7}>
                              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                <HiOutlineUsers style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '8px' }} />
                                <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 4px', color: '#334155' }}>
                                  No candidates found
                                </p>
                                <p style={{ fontSize: '0.82rem', margin: 0 }}>
                                  {attendedSearch || attendedDeptFilter !== 'ALL' || attendedStatusFilter !== 'ALL' || attendedVisitFilter !== 'ALL'
                                    ? 'Try clearing your filters or search terms.'
                                    : `No registered candidates for ${comp.name} drives.`}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredAttended.map((s, idx) => (
                            <tr key={s.attendanceKey || (s._id ? `${s._id}_${s.visitNumber || 1}_${idx}` : idx)}>
                              <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                                {idx + 1}
                              </td>

                              {/* Student Name & Roll */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '50%',
                                      background: '#f8fafc',
                                      color: '#1e293b',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.82rem',
                                      fontWeight: 700,
                                      border: '1px solid #e2e8f0',
                                    }}
                                  >
                                    {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                      {s.name}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                                      {s.rollNumber}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Dept & Year Badge */}
                              <td>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: '#f1f5f9',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                    padding: '3px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  {s.deptYearLabel || `${s.department} (${s.batch})`}
                                </span>
                              </td>

                              {/* CGPA */}
                              <td style={{ textAlign: 'center', fontWeight: 600, color: '#0f172a' }}>
                                {s.cgpa || '-'}
                              </td>

                              {/* Drives Participated with Visit Badge */}
                              <td style={{ fontSize: '0.82rem', color: '#475569' }}>
                                {s.drives && s.drives.length > 0 ? (
                                  s.drives.map((d, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '3px 0', flexWrap: 'wrap' }}>
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          background: '#eff6ff',
                                          color: '#1d4ed8',
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          fontWeight: 700,
                                          border: '1px solid #bfdbfe',
                                        }}
                                      >
                                        Visit {d.visitNumber || 1}
                                      </span>
                                      <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                        {d.role || 'Campus Drive'}
                                      </span>
                                      {d.driveDate && (
                                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                                          ({new Date(d.driveDate).toLocaleDateString('en-IN')})
                                        </span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <span>General Campus Drive (Visit 1)</span>
                                )}
                              </td>

                              {/* Highest Round */}
                              <td>
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: s.isPlaced ? '#15803d' : '#475569',
                                  }}
                                >
                                  {s.highestRound || 'Registered'}
                                </span>
                              </td>

                              {/* Outcome */}
                              <td style={{ textAlign: 'center' }}>
                                {s.isPlaced ? (
                                  <span
                                    className="badge badge-success"
                                    style={{ fontWeight: 800, fontSize: '0.76rem', padding: '3px 8px' }}
                                  >
                                    🏆 Placed
                                  </span>
                                ) : s.latestStatus === 'eliminated' ? (
                                  <span
                                    className="badge badge-neutral"
                                    style={{ fontWeight: 600, fontSize: '0.74rem', padding: '3px 8px', color: '#64748b' }}
                                  >
                                    Eliminated
                                  </span>
                                ) : (
                                  <span
                                    className="badge badge-info"
                                    style={{ fontWeight: 600, fontSize: '0.74rem', padding: '3px 8px' }}
                                  >
                                    Participated
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: RECRUITMENT DRIVES */}
              {activeTab === 'drives' && (
                <div>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                        Placement & Recruitment Drives for {comp.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        Showing <strong>{filteredDrives.length}</strong> of <strong>{drivesList.length}</strong> drive records
                        {drivesVisitFilter !== 'ALL' && ` (Filtered by Visit ${drivesVisitFilter})`}
                      </div>
                    </div>

                    {/* Visit Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        value={drivesVisitFilter}
                        onChange={(e) => setDrivesVisitFilter(e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.84rem',
                          background: '#ffffff',
                          color: '#334155',
                          outline: 'none',
                        }}
                      >
                        <option value="ALL">All Campus Visits</option>
                        {availableVisits.map((v) => (
                          <option key={v} value={v}>
                            Visit {v} Drives Only
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {filteredDrives.length === 0 ? (
                    <div
                      style={{
                        padding: '40px',
                        textAlign: 'center',
                        background: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <HiOutlineBriefcase style={{ fontSize: '2.5rem', color: '#cbd5e1', marginBottom: '8px' }} />
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: '0 0 4px', color: '#334155' }}>
                        No recruitment drives found
                      </p>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                        {drivesVisitFilter !== 'ALL'
                          ? `No drives found specifically recorded for Visit ${drivesVisitFilter}.`
                          : `Create a separate drive under Placement Drives to track Visit 1, Visit 2, etc.`}
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
                      {filteredDrives.map((d) => (
                        <div
                          key={d._id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            padding: '18px 20px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <span
                                  style={{
                                    background: '#eff6ff',
                                    color: '#2563eb',
                                    border: '1px solid #bfdbfe',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  Campus Visit {d.visitNumber || 1}
                                </span>
                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: d.status === 'Ongoing' ? '#059669' : '#64748b',
                                  }}
                                >
                                  • {d.status || 'Active'}
                                </span>
                              </div>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                {d.role || 'Software Engineer'}
                              </h4>
                              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <HiOutlineCalendar />
                                {d.driveDate
                                  ? new Date(d.driveDate).toLocaleDateString('en-IN', {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })
                                  : 'Date TBA'}
                              </div>
                            </div>
                            <span
                              className="badge badge-success"
                              style={{ fontWeight: 800, fontSize: '0.82rem', padding: '4px 10px' }}
                            >
                              ₹{d.package || '0'} LPA
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '8px',
                              background: '#f8fafc',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              marginTop: '12px',
                              textAlign: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>ROUNDS</div>
                              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                {d.roundsCount ?? d.rounds?.length ?? 0}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>ATTENDED</div>
                              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#2563eb' }}>
                                {d.registeredCount ?? d.registeredStudents?.length ?? 0}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PLACED</div>
                              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#16a34a' }}>
                                {d.placedCount ?? d.finalSelectedStudents?.length ?? 0}
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Min CGPA: <strong>{d.minCgpa || 'Any'}</strong></span>
                            <span>Max Arrears: <strong>{d.maxCurrentArrears ?? 0}</strong></span>
                            <span style={{ fontWeight: 700, color: d.status === 'Ongoing' ? '#059669' : '#64748b' }}>
                              {d.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: COMPANY INFO & CONTACT */}
              {activeTab === 'about' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Section 1: Preserved Points of Contact per Campus Visit */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#eff6ff',
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                          }}
                        >
                          <HiOutlineUser />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            Campus Visits & Points of Contact ({visitsList.length})
                          </h4>
                          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                            Distinct coordinator & HR contact details preserved for each campus visit
                          </p>
                        </div>
                      </div>

                      {selectedVisit !== 'ALL' && (
                        <button
                          onClick={() => setSelectedVisit('ALL')}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            padding: '4px 12px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: '#1e293b',
                            cursor: 'pointer',
                          }}
                        >
                          Show All Visit Contacts
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                      {visitsList
                        .filter((v) => selectedVisit === 'ALL' || Number(v.visitNumber) === Number(selectedVisit))
                        .map((v) => {
                          const isActive = Number(selectedVisit) === Number(v.visitNumber);
                          return (
                            <div
                              key={v.visitNumber}
                              style={{
                                background: '#ffffff',
                                borderRadius: '12px',
                                border: isActive ? '2px solid #2563eb' : '1px solid #e2e8f0',
                                padding: '18px',
                                boxShadow: isActive ? '0 4px 16px rgba(37, 99, 235, 0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
                                position: 'relative',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      background: isActive ? '#2563eb' : '#0f172a',
                                      color: '#ffffff',
                                      padding: '3px 10px',
                                      borderRadius: '16px',
                                      fontSize: '0.78rem',
                                      fontWeight: 800,
                                      letterSpacing: '0.02em',
                                    }}
                                  >
                                    Campus Visit {v.visitNumber}
                                  </span>
                                  {isActive && (
                                    <span style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, background: '#eff6ff', padding: '2px 8px', borderRadius: '12px' }}>
                                      Active Selected
                                    </span>
                                  )}
                                </div>
                                {v.date && (
                                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    {new Date(v.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                    Point of Contact Person
                                  </div>
                                  <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                                    {v.contactPerson || '-'}
                                  </div>
                                </div>

                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                    Designation / Role
                                  </div>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                                    {v.contactRole || 'Campus Hiring Lead / HR Manager'}
                                  </div>
                                </div>

                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                    Contact Email
                                  </div>
                                  <div style={{ fontSize: '0.88rem', marginTop: '2px' }}>
                                    {v.contactEmail ? (
                                      <a
                                        href={`mailto:${v.contactEmail}`}
                                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                                      >
                                        {v.contactEmail}
                                      </a>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>-</span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                    Contact Phone
                                  </div>
                                  <div style={{ fontSize: '0.88rem', marginTop: '2px' }}>
                                    {v.contactPhone ? (
                                      <a
                                        href={`tel:${v.contactPhone}`}
                                        style={{ color: '#059669', textDecoration: 'none', fontWeight: 600 }}
                                      >
                                        {v.contactPhone}
                                      </a>
                                    ) : (
                                      <span style={{ color: '#94a3b8' }}>-</span>
                                    )}
                                  </div>
                                </div>

                                {v.location && (
                                  <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                      Location
                                    </div>
                                    <div style={{ fontSize: '0.86rem', color: '#475569', marginTop: '2px' }}>
                                      {v.location}
                                    </div>
                                  </div>
                                )}

                                {v.description && (
                                  <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                                      Drive / Visit Focus
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', fontStyle: 'italic', background: '#f8fafc', padding: '6px 10px', borderRadius: '6px' }}>
                                      {v.description}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Section 2: Company Overview & Department Breakdown */}
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      padding: '20px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: '#f0fdf4',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                        }}
                      >
                        <HiOutlineOfficeBuilding />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                          Company Profile
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                          Corporate overview and department placements
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Industry Sector
                        </div>
                        <div style={{ marginTop: '4px' }}>
                          <span className="badge badge-info">{comp.industry || 'IT / Corporate'}</span>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Website
                        </div>
                        <div style={{ fontSize: '0.9rem', marginTop: '2px' }}>
                          {comp.website ? (
                            <a
                              href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {comp.website} <HiOutlineExternalLink />
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          About Company
                        </div>
                        <p style={{ fontSize: '0.86rem', color: '#475569', lineHeight: 1.5, margin: '4px 0 0' }}>
                          {comp.description || 'No additional description entered.'}
                        </p>
                      </div>

                      {/* Department Breakdown */}
                      {displayDeptBreakdown && Object.keys(displayDeptBreakdown).length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
                            Placed Students by Department {selectedVisit !== 'ALL' && `(Visit ${selectedVisit})`}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {Object.entries(displayDeptBreakdown).map(([dept, count]) => (
                              <span
                                key={dept}
                                style={{
                                  background: '#f1f5f9',
                                  color: '#1e293b',
                                  border: '1px solid #cbd5e1',
                                  padding: '4px 10px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                }}
                              >
                                {dept === 'AIDS' ? 'AI&DS' : dept}: <strong>{count}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CompanyDetailModal;
