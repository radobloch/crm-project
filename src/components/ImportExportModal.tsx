import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, Check, AlertCircle, FileCode } from 'lucide-react';
import { Collection, RecordItem } from '../types';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  records: RecordItem[];
  onImportRecords: (collectionId: string, newRecords: RecordItem[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  collection,
  records,
  onImportRecords,
}) => {
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${collection.name}_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    if (records.length === 0) return;
    const headers = collection.fields.map((f) => f.name);
    const csvRows = [];
    csvRows.push(headers.join(','));

    records.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header];
        if (val === undefined || val === null) return '""';
        const escaped = ('' + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvData = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvData);
    downloadAnchor.setAttribute('download', `${collection.name}_export_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      const validItems: RecordItem[] = items.map((it, idx) => ({
        id: it.id || `imp_${Date.now()}_${idx}`,
        createdAt: it.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...it,
      }));

      onImportRecords(collection.id, validItems);
      setImportStatus(`Successfully imported ${validItems.length} records into ${collection.title}!`);
      setImportJsonText('');
      setTimeout(() => {
        setImportStatus(null);
        onClose();
      }, 1500);
    } catch (e: any) {
      setImportStatus(`Import Error: Invalid JSON syntax - ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#09090b] text-[#fafafa] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-zinc-900">
          <div className="flex items-center space-x-2.5">
            <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Import & Export Data Hub
              </h3>
              <p className="text-xs text-zinc-400">
                Target Collection: <span className="font-semibold text-zinc-200">{collection.title}</span> ({records.length} records)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Export Collection Records
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportJson}
                className="flex items-center justify-center space-x-2 p-3 rounded-lg border border-[#27272a] bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span>Export as JSON</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center justify-center space-x-2 p-3 rounded-lg border border-[#27272a] bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export as CSV</span>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-3 pt-2 border-t border-[#27272a]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Import Records from JSON
            </h4>
            <p className="text-xs text-zinc-400">
              Paste an array of JSON objects matching the collection fields schema:
            </p>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder={`[\n  { "title": "New Item", "value": 1200 }\n]`}
              className="w-full text-xs font-mono p-3 rounded-lg border border-[#27272a] bg-zinc-950 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 outline-none"
            />

            {importStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
                  importStatus.includes('Error')
                    ? 'bg-red-950/40 text-red-300 border border-red-800/40'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                }`}
              >
                {importStatus.includes('Error') ? (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <span>{importStatus}</span>
              </div>
            )}

            <button
              onClick={handleImportJson}
              disabled={!importJsonText.trim()}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Records Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
