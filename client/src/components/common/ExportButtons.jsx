import { useState } from 'react';
import { HiOutlineDocumentDownload, HiOutlineTable } from 'react-icons/hi';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const ExportButtons = ({ data, onExport, columns, filename, title }) => {
  const [exporting, setExporting] = useState(null); // 'excel' or 'pdf' or null

  const handleExport = async (type) => {
    setExporting(type);
    try {
      let exportData = data;
      if (onExport) {
        exportData = await onExport();
      }
      if (!exportData || exportData.length === 0) {
        toast.error('No data to export');
        return;
      }
      if (type === 'excel') {
        exportToExcel(exportData, columns, filename);
      } else {
        exportToPDF(exportData, columns, filename, title);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to prepare data for export');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="toolbar-right" style={{ display: 'flex', gap: '8px' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => handleExport('excel')}
        disabled={exporting !== null}
        title="Export to Excel"
        id={`export-excel-${filename}`}
      >
        <HiOutlineTable /> {exporting === 'excel' ? 'Exporting...' : 'Excel'}
      </button>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => handleExport('pdf')}
        disabled={exporting !== null}
        title="Export to PDF"
        id={`export-pdf-${filename}`}
      >
        <HiOutlineDocumentDownload /> {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
      </button>
    </div>
  );
};

export default ExportButtons;
