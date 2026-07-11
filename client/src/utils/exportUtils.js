import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export data to Excel (.xlsx)
 */
export const exportToExcel = (data, columns, filename = 'export') => {
  const exportData = data.map((row) => {
    const obj = {};
    columns.forEach((col) => {
      obj[col.header] = col.accessor(row);
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  // Auto-size columns
  const colWidths = columns.map((col) => ({
    wch: Math.max(
      col.header.length,
      ...exportData.map((row) => String(row[col.header] || '').length)
    ) + 2,
  }));
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

/**
 * Export data to PDF
 */
export const exportToPDF = (data, columns, filename = 'export', title = 'Report') => {
  const doc = new jsPDF('l', 'mm', 'a4');

  // Title
  doc.setFontSize(16);
  doc.setTextColor(99, 102, 241);
  doc.text(title, 14, 20);

  // Date
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);

  // Table
  const headers = columns.map((col) => col.header);
  const body = data.map((row) =>
    columns.map((col) => String(col.accessor(row) ?? ''))
  );

  autoTable(doc, {
    startY: 34,
    head: [headers],
    body,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}.pdf`);
};
