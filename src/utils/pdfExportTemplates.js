import * as jspdfModule from 'jspdf';
import autoTable, { applyPlugin } from 'jspdf-autotable';

// Resolve jsPDF constructor robustly across ESM and CJS bundlers
const jsPDF = jspdfModule.jsPDF || jspdfModule.default;

// Ensure autoTable plugin is registered on jsPDF prototype
try {
  applyPlugin(jsPDF);
} catch (e) {
  // Ignored if already applied
}

/**
 * Robust wrapper to execute autoTable regardless of environment
 */
const runAutoTable = (doc, options) => {
  if (typeof doc.autoTable === 'function') {
    return doc.autoTable(options);
  }
  return autoTable(doc, options);
};

/**
 * Format timestamp for report headers
 */
const getFormattedDateTime = () => {
  const d = new Date();
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Add corporate top accent and letterhead to document
 */
const addCorporateHeader = (doc, { title, subtitle, documentRef, categoryColor = [79, 70, 229] }) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top accent colored stripe (4mm height)
  doc.setFillColor(...categoryColor);
  doc.rect(0, 0, pageWidth, 4, 'F');

  // 2. Company Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('NEXORA TECHNOLOGIES', 14, 15);

  // 3. Sub-brand / Platform tag
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Enterprise Workforce & Daily Progress Platform', 14, 20);

  // 4. Right side Document Ref & Timestamp
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`DOC REF: ${documentRef || 'NEX-DPR-OFFICIAL'}`, pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${getFormattedDateTime()}`, pageWidth - 14, 19, { align: 'right' });

  // 5. Divider line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(14, 23, pageWidth - 14, 23);

  // 6. Document Title Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...categoryColor);
  doc.text(title.toUpperCase(), 14, 30);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 14, 35);
  }
};

/**
 * Add multi-page footer to all pages after table generation
 */
const addMultiPageFooters = (doc, { confidentialityNotice = 'Confidential — Nexora Technologies Internal Operations' } = {}) => {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    // Left disclaimer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(confidentialityNotice, 14, pageHeight - 7);

    // Right Page X of Y
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }
};

/**
 * TEMPLATE 1: Today's Workforce Attendance Category Report
 * (Present, Absent, Leave, or All Roster)
 */
export const exportTodayAttendancePDF = ({ list = [], categoryType = 'all', todayStr, staffTotal, isSunday = false }) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  let categoryLabel = 'Complete Workforce Roster';
  let categoryColor = [67, 56, 202]; // indigo-700
  let badgeLabel = 'All Registered Staff';

  if (categoryType === 'present') {
    categoryLabel = 'Present Employees Roster';
    categoryColor = [5, 150, 105]; // emerald-600
    badgeLabel = 'Verified Present / Checked-In';
  } else if (categoryType === 'absent') {
    categoryLabel = isSunday ? 'Sunday Holiday Attendance Status' : 'Absent Workforce Exceptions';
    categoryColor = [225, 29, 72]; // rose-600
    badgeLabel = isSunday ? 'Weekly Holiday (Zero Absences)' : 'Unexcused / Absent Today';
  } else if (categoryType === 'leave') {
    categoryLabel = 'Employees On Approved Leave';
    categoryColor = [124, 58, 237]; // purple-600
    badgeLabel = 'Approved Official Leave';
  }

  // 1. Corporate Header
  addCorporateHeader(doc, {
    title: `Today's Attendance - ${categoryLabel}`,
    subtitle: `Live workforce roster and check-in audit for ${todayStr}${isSunday ? ' (Weekly Holiday: Sunday)' : ''}`,
    documentRef: `ATT-${todayStr.replace(/-/g, '')}-${categoryType.toUpperCase()}`,
    categoryColor
  });

  // 2. Summary KPI Box
  const summaryBoxY = 40;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, summaryBoxY, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('REPORT DATE', 20, summaryBoxY + 6);
  doc.text('CATEGORY FILTER', 70, summaryBoxY + 6);
  doc.text('LISTED HEADCOUNT', 125, summaryBoxY + 6);
  doc.text('TOTAL ACTIVE STAFF', 165, summaryBoxY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${todayStr}${isSunday ? ' (Sunday)' : ''}`, 20, summaryBoxY + 12);
  doc.setTextColor(...categoryColor);
  doc.text(badgeLabel, 70, summaryBoxY + 12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${list.length} Employees`, 125, summaryBoxY + 12);
  doc.text(`${staffTotal || list.length} Staff`, 165, summaryBoxY + 12);

  // 3. Table Rows
  const tableColumns = ["#", "Emp ID", "Employee Name", "Department", "Check-In", "Check-Out", "Status", "Attendance %"];
  const tableRows = list.map((item, index) => [
    (index + 1).toString(),
    item.user.id,
    item.user.name,
    item.user.department || 'Engineering',
    item.record?.checkInTime || '--:--',
    item.record?.checkOutTime || '--:--',
    item.status || 'Not Marked',
    `${item.attendancePct !== undefined ? item.attendancePct : 100}%`
  ]);

  runAutoTable(doc, {
    startY: summaryBoxY + 22,
    head: [tableColumns],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: categoryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 36, fontStyle: 'bold' },
      3: { cellWidth: 26 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 26, fontStyle: 'bold' },
      7: { cellWidth: 24, fontStyle: 'bold', halign: 'center' }
    },
    didParseCell: (data) => {
      // Dynamic coloring for status column
      if (data.section === 'body' && data.column.index === 6) {
        const val = String(data.cell.raw || '');
        if (val.includes('Present')) {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (val.includes('Sunday') || val.includes('Holiday')) {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        } else if (val.includes('Absent')) {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        } else if (val.includes('Leave')) {
          data.cell.styles.textColor = [124, 58, 237]; // purple-600
        }
      }
      // Dynamic coloring for Attendance % column
      if (data.section === 'body' && data.column.index === 7) {
        const pctNum = parseInt(String(data.cell.raw || '100'), 10);
        if (pctNum >= 90) data.cell.styles.textColor = [5, 150, 105];
        else if (pctNum >= 75) data.cell.styles.textColor = [37, 99, 235];
        else if (pctNum >= 50) data.cell.styles.textColor = [217, 119, 6];
        else data.cell.styles.textColor = [225, 29, 72];
      }
    }
  });

  // 4. Add multi-page footers
  addMultiPageFooters(doc);

  // 5. Save PDF
  const cleanTitle = categoryLabel.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Nexora_Today_${cleanTitle}_${todayStr}.pdf`);
  return true;
};

/**
 * TEMPLATE 2: Attendance History & Records Audit Report
 */
export const exportAttendanceHistoryPDF = ({ records = [], todayStr, filterSummary = 'All Records' }) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const themeColor = [67, 56, 202]; // indigo-700

  // 1. Corporate Header
  addCorporateHeader(doc, {
    title: 'Attendance Management Audit Report',
    subtitle: `Historical workforce attendance logs and check-in timeline — Filter: ${filterSummary}`,
    documentRef: `ATT-HIST-${todayStr.replace(/-/g, '')}`,
    categoryColor: themeColor
  });

  // 2. Summary KPI Box
  const summaryBoxY = 40;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, summaryBoxY, pageWidth - 28, 15, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('EXPORT DATE', 20, summaryBoxY + 5.5);
  doc.text('APPLIED FILTERS', 70, summaryBoxY + 5.5);
  doc.text('TOTAL RECORDS', 135, summaryBoxY + 5.5);
  doc.text('SYSTEM AUDIT', 170, summaryBoxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(todayStr, 20, summaryBoxY + 11.5);
  doc.setTextColor(...themeColor);
  doc.text(filterSummary.slice(0, 32), 70, summaryBoxY + 11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${records.length} Entries`, 135, summaryBoxY + 11.5);
  doc.setTextColor(5, 150, 105);
  doc.text('Verified', 170, summaryBoxY + 11.5);

  // 3. Table Rows
  const tableColumns = ["#", "Date", "Emp ID", "Employee Name", "Department", "In Time", "Out Time", "Status", "Marked By"];
  const tableRows = records.map((r, idx) => [
    (idx + 1).toString(),
    r.date,
    r.employeeId,
    r.employeeName,
    r.department || 'N/A',
    r.checkInTime || '--:--',
    r.checkOutTime || '--:--',
    r.status || 'Present',
    r.markedBy || 'Self'
  ]);

  runAutoTable(doc, {
    startY: summaryBoxY + 20,
    head: [tableColumns],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18 },
      2: { cellWidth: 18, fontStyle: 'bold' },
      3: { cellWidth: 34, fontStyle: 'bold' },
      4: { cellWidth: 26 },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 22, fontStyle: 'bold' },
      8: { cellWidth: 18 }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const val = String(data.cell.raw || '');
        if (val.includes('Present')) data.cell.styles.textColor = [5, 150, 105];
        else if (val.includes('Absent')) data.cell.styles.textColor = [225, 29, 72];
        else if (val.includes('Leave')) data.cell.styles.textColor = [124, 58, 237];
        else if (val.includes('Late')) data.cell.styles.textColor = [217, 119, 6];
      }
    }
  });

  addMultiPageFooters(doc);
  doc.save(`Nexora_Attendance_Report_${todayStr}.pdf`);
  return true;
};

/**
 * TEMPLATE 3: Official Leave Applications & Absence Audit Report
 */
export const exportLeaveApplicationsPDF = ({ applications = [], todayStr }) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const themeColor = [124, 58, 237]; // purple-600

  // 1. Corporate Header
  addCorporateHeader(doc, {
    title: 'Official Leave Applications & Absence Audit',
    subtitle: `Employee leave requests, approvals, and balance duration (Sundays excluded as weekly holidays)`,
    documentRef: `LV-AUDIT-${todayStr.replace(/-/g, '')}`,
    categoryColor: themeColor
  });

  // 2. Summary KPI Box
  const summaryBoxY = 40;
  const approvedCount = applications.filter(a => a.status === 'Approved').length;
  const pendingCount = applications.filter(a => a.status === 'Pending').length;
  const rejectedCount = applications.filter(a => a.status === 'Rejected').length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, summaryBoxY, pageWidth - 28, 15, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL REQUESTS', 20, summaryBoxY + 5.5);
  doc.text('APPROVED', 65, summaryBoxY + 5.5);
  doc.text('PENDING REVIEW', 110, summaryBoxY + 5.5);
  doc.text('REJECTED', 158, summaryBoxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${applications.length} Records`, 20, summaryBoxY + 11.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`${approvedCount} Approved`, 65, summaryBoxY + 11.5);
  doc.setTextColor(217, 119, 6);
  doc.text(`${pendingCount} Pending`, 110, summaryBoxY + 11.5);
  doc.setTextColor(225, 29, 72);
  doc.text(`${rejectedCount} Rejected`, 158, summaryBoxY + 11.5);

  // 3. Table Rows
  const tableColumns = ["ID", "Employee Name", "Leave Type", "Start Date", "End Date", "Days", "Status", "Reason / Notes"];
  const tableRows = applications.map(l => [
    l.id,
    `${l.employeeName} (${l.employeeId})`,
    l.leaveType,
    l.startDate,
    l.endDate,
    `${l.totalDays}d`,
    l.status,
    (l.reason || 'N/A').slice(0, 50) + ((l.reason || '').length > 50 ? '...' : '')
  ]);

  runAutoTable(doc, {
    startY: summaryBoxY + 20,
    head: [tableColumns],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 20, fontStyle: 'bold' },
      7: { cellWidth: 'auto' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = String(data.cell.raw || '');
        if (val === 'Approved') data.cell.styles.textColor = [5, 150, 105];
        else if (val === 'Pending') data.cell.styles.textColor = [217, 119, 6];
        else if (val === 'Rejected') data.cell.styles.textColor = [225, 29, 72];
      }
    }
  });

  addMultiPageFooters(doc);
  doc.save(`Nexora_Leave_Applications_${todayStr}.pdf`);
  return true;
};

/**
 * TEMPLATE 4: Daily Progress Report (DPR) Enterprise Registry (Landscape A4)
 */
export const exportDPRRegistryPDF = ({ reports = [], dateStr = new Date().toISOString().split('T')[0] }) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape
  const pageWidth = doc.internal.pageSize.getWidth();
  const themeColor = [37, 99, 235]; // blue-600

  // 1. Corporate Header
  addCorporateHeader(doc, {
    title: 'Daily Progress Report (DPR) Registry',
    subtitle: `Official submission logs, task completions, and productivity metrics — Nexora Technologies`,
    documentRef: `DPR-REG-${dateStr.replace(/-/g, '')}`,
    categoryColor: themeColor
  });

  // 2. Summary KPI Box
  const summaryBoxY = 40;
  const totalHours = reports.reduce((acc, r) => acc + (parseFloat(r.hoursWorked) || 0), 0);
  const avgCompletion = reports.length > 0 
    ? Math.round(reports.reduce((acc, r) => acc + (parseFloat(r.percentageCompleted) || 0), 0) / reports.length) 
    : 100;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, summaryBoxY, pageWidth - 28, 15, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('REGISTRY DATE', 20, summaryBoxY + 5.5);
  doc.text('TOTAL SUBMISSIONS', 80, summaryBoxY + 5.5);
  doc.text('TOTAL HOURS WORKED', 150, summaryBoxY + 5.5);
  doc.text('AVG COMPLETION', 220, summaryBoxY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(dateStr, 20, summaryBoxY + 11.5);
  doc.setTextColor(...themeColor);
  doc.text(`${reports.length} Reports`, 80, summaryBoxY + 11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalHours.toFixed(1)} Hours`, 150, summaryBoxY + 11.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`${avgCompletion}% Completed`, 220, summaryBoxY + 11.5);

  // 3. Table Rows
  const tableHeaders = [["ID", "Date", "Employee", "Project", "Module", "Hours", "% Done", "Task Completed Today", "Status"]];
  const tableRows = reports.map(r => [
    r.id,
    r.date,
    r.employeeName,
    r.projectName,
    r.moduleName || '-',
    `${r.hoursWorked}h`,
    `${r.percentageCompleted}%`,
    (r.taskCompletedToday || 'No description').slice(0, 65) + ((r.taskCompletedToday || '').length > 65 ? '...' : ''),
    r.status
  ]);

  runAutoTable(doc, {
    startY: summaryBoxY + 20,
    head: tableHeaders,
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 22 },
      2: { cellWidth: 36, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 28 },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 'auto' },
      8: { cellWidth: 22, fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const val = String(data.cell.raw || '');
        if (val === 'Approved') data.cell.styles.textColor = [5, 150, 105];
        else if (val === 'Rejected') data.cell.styles.textColor = [225, 29, 72];
        else if (val === 'Pending') data.cell.styles.textColor = [217, 119, 6];
      }
    }
  });

  addMultiPageFooters(doc);
  doc.save(`Nexora_DPR_Registry_${dateStr}.pdf`);
  return true;
};

/**
 * TEMPLATE 5: Individual Employee DPR Report Certificate
 */
export const exportIndividualDPRPDF = ({ report }) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const themeColor = [79, 70, 229]; // indigo-600

  // 1. Corporate Header
  addCorporateHeader(doc, {
    title: 'Daily Progress Report - Submission Certificate',
    subtitle: `Official single-day task record and performance audit — Nexora Technologies`,
    documentRef: `DPR-${report.id}`,
    categoryColor: themeColor
  });

  // 2. Employee & Project Information Cards (2 Side-by-side blocks)
  const metaY = 40;
  const colWidth = (pageWidth - 32) / 2;

  // Left card: Employee Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, metaY, colWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...themeColor);
  doc.text('EMPLOYEE INFORMATION', 20, metaY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Full Name:', 20, metaY + 14);
  doc.text('Employee ID:', 20, metaY + 20);
  doc.text('Department / Role:', 20, metaY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(report.employeeName || 'N/A', 50, metaY + 14);
  doc.text(report.employeeId || 'N/A', 50, metaY + 20);
  doc.text(report.department || 'Engineering', 50, metaY + 26);

  // Right card: Submission & Project Details
  const rightX = 14 + colWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, metaY, colWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...themeColor);
  doc.text('PROJECT & SUBMISSION METRICS', rightX + 6, metaY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Date:', rightX + 6, metaY + 14);
  doc.text('Project & Module:', rightX + 6, metaY + 20);
  doc.text('Hours & Progress:', rightX + 6, metaY + 26);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(report.date || 'N/A', rightX + 38, metaY + 14);
  doc.text(`${report.projectName} (${report.moduleName || 'Core'})`, rightX + 38, metaY + 20);
  doc.text(`${report.hoursWorked} hrs | ${report.percentageCompleted}% Done (${report.status})`, rightX + 38, metaY + 26);

  // 3. Detailed Structured Table
  const reportDetails = [
    ["Project Name", report.projectName || 'Nexora Platform'],
    ["Module Name", report.moduleName || 'General Core'],
    ["Assigned Task", report.taskAssigned || 'Daily Assigned Responsibilities'],
    ["Task Completed Today", report.taskCompletedToday || 'No details provided'],
    ["Hours Logged", `${report.hoursWorked} hours`],
    ["Completion Percentage", `${report.percentageCompleted}%`],
    ["Work Status", report.workStatus || 'In Progress'],
    ["Challenges / Blockers", report.challengesFaced || "None encountered"],
    ["Tomorrow's Plan", report.tomorrowPlan || "Continue scheduled project milestones"],
    ["Approval Status", report.status || "Pending"],
    ["Manager / Lead Feedback", report.feedback || "Pending manager assessment"]
  ];

  runAutoTable(doc, {
    startY: metaY + 39,
    head: [["Section / Field", "Submission Details"]],
    body: reportDetails,
    theme: 'grid',
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' }
    }
  });

  // 4. Dual Signatures Section
  const lastY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 18 : 220;
  
  if (lastY < 240) {
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);

    // Employee Signature Line
    doc.line(20, lastY + 15, 80, lastY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Employee Signature", 20, lastY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Signed by: ${report.employeeName}`, 20, lastY + 25);

    // Manager / Authority Signature Line
    doc.line(130, lastY + 15, 190, lastY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("Manager / Authority Signature", 130, lastY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Status: ${report.status}`, 130, lastY + 25);
  }

  // 5. Multi-page footers
  addMultiPageFooters(doc);

  const cleanName = (report.employeeName || 'Staff').replace(/\s+/g, '_');
  doc.save(`Nexora_DPR_${cleanName}_${report.date}.pdf`);
  return true;
};

/**
 * TEMPLATE 5: Workforce Attendance Percentages & Compliance Audit Report
 * Full individual breakdown of staff attendance rate, working days, absences, leaves, and policy standing.
 */
export const exportWorkforceAttendancePercentagesPDF = ({
  rankings = [],
  todayStr,
  staffTotal,
  appliedFilters = {}
}) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const themeColor = [79, 70, 229]; // indigo-600

  // 1. Corporate Header
  addCorporateHeader(doc, {
    title: 'Workforce Attendance & Compliance Performance Report',
    subtitle: `Cumulative attendance percentage audit, working days breakdown, and policy compliance standing as of ${todayStr}`,
    documentRef: `ATT-PCT-${todayStr ? todayStr.replace(/-/g, '') : 'AUDIT'}`,
    categoryColor: themeColor
  });

  // 2. Calculations for Summary Box
  const totalEvaluated = rankings.length;
  const compliantCount = rankings.filter(r => (r.stats.attendancePct ?? 100) >= 75).length;
  const warningCount = rankings.filter(r => (r.stats.attendancePct ?? 100) < 75 && (r.stats.attendancePct ?? 100) >= 50).length;
  const criticalCount = rankings.filter(r => (r.stats.attendancePct ?? 100) < 50).length;
  
  const avgPct = totalEvaluated > 0
    ? Math.round(rankings.reduce((acc, curr) => acc + (curr.stats.attendancePct ?? 100), 0) / totalEvaluated)
    : 100;

  // 3. Summary KPI Box
  const summaryBoxY = 40;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, summaryBoxY, pageWidth - 28, 16, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 5;

  // Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('EVALUATED STAFF', 18, summaryBoxY + 5.5);
  doc.text('COMPLIANT (>=75%)', 18 + colWidth, summaryBoxY + 5.5);
  doc.text('WARNING (50-74%)', 18 + colWidth * 2, summaryBoxY + 5.5);
  doc.text('CRITICAL (<50%)', 18 + colWidth * 3, summaryBoxY + 5.5);
  doc.text('AVG ATTENDANCE', 18 + colWidth * 4, summaryBoxY + 5.5);

  // Values
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`${totalEvaluated} Members`, 18, summaryBoxY + 11.5);

  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`${compliantCount} Staff`, 18 + colWidth, summaryBoxY + 11.5);

  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(`${warningCount} Staff`, 18 + colWidth * 2, summaryBoxY + 11.5);

  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(`${criticalCount} Staff`, 18 + colWidth * 3, summaryBoxY + 11.5);

  doc.setTextColor(...themeColor);
  doc.text(`${avgPct}% Rate`, 18 + colWidth * 4, summaryBoxY + 11.5);

  // 4. Policy Legend Strip
  const legendY = summaryBoxY + 19;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, legendY, pageWidth - 28, 7.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  const legendText = 'POLICY BENCHMARKS:  [>=90% Excellent Tier]   [75-89% Good Standing]   [50-74% Warning Notice]   [<50% Actionable / Login Revocation]';
  doc.text(legendText, pageWidth / 2, legendY + 5, { align: 'center' });

  // 5. Table Rows
  const tableColumns = ["#", "Emp ID", "Employee Name", "Department", "Work Days", "Present", "Late", "Absent", "Leaves", "Rate %", "Policy Standing"];
  const tableRows = rankings.map((item, idx) => {
    const u = item.user;
    const st = item.stats;
    return [
      (idx + 1).toString(),
      u.id,
      u.name,
      u.department || 'General',
      st.totalWorkingDays.toString(),
      st.presentDays.toString(),
      st.lateDays.toString(),
      st.absentDays.toString(),
      st.leaveDays.toString(),
      `${st.attendancePct}%`,
      st.indicator?.label || (st.attendancePct >= 75 ? 'Good Standing' : 'At Risk')
    ];
  });

  runAutoTable(doc, {
    startY: legendY + 10,
    head: [tableColumns],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: themeColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 16, fontStyle: 'bold' },
      2: { cellWidth: 32, fontStyle: 'bold' },
      3: { cellWidth: 24 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 13, halign: 'center' },
      8: { cellWidth: 13, halign: 'center' },
      9: { cellWidth: 16, fontStyle: 'bold', halign: 'center' },
      10: { cellWidth: 20, fontStyle: 'bold', halign: 'center' }
    },
    didParseCell: (data) => {
      // Dynamic coloring for Rate % column (index 9)
      if (data.section === 'body' && data.column.index === 9) {
        const pctNum = parseInt(String(data.cell.raw || '100'), 10);
        if (pctNum >= 90) {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (pctNum >= 75) {
          data.cell.styles.textColor = [37, 99, 235]; // blue-600
        } else if (pctNum >= 50) {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        }
      }
      // Dynamic coloring for Policy Standing column (index 10)
      if (data.section === 'body' && data.column.index === 10) {
        const val = String(data.cell.raw || '');
        if (val.includes('Warning') || val.includes('Risk')) {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        } else if (val.includes('Critical') || val.includes('Terminated')) {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        } else {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        }
      }
      // Dynamic coloring for Absent column (index 7)
      if (data.section === 'body' && data.column.index === 7) {
        const absVal = parseInt(String(data.cell.raw || '0'), 10);
        if (absVal > 0) {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // 6. Corporate Multi-Page Footers
  addMultiPageFooters(doc, { confidentialityNotice: 'Official Compliance Audit — Nexora Technologies Internal Operations' });

  // 7. Save Document
  doc.save(`Nexora_Workforce_Attendance_Percentages_${todayStr}.pdf`);
  return true;
};
