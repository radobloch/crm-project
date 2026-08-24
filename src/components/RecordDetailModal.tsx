import React, { useState } from 'react';
import { X, Edit2, Copy, Check, Database, Clock, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { Collection, RecordItem } from '../types';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  record: RecordItem | null;
  onEdit: (record: RecordItem) => void;
  canEdit: boolean;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  collection,
  record,
  onEdit,
  canEdit,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !record) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const primaryField = collection.fields.find((f) => f.isPrimary) || collection.fields[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#09090b] text-[#fafafa] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-zinc-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/40 flex items-center justify-center font-bold text-xs">
              ID
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 truncate max-w-md">
                {record[primaryField?.name || 'title'] || 'Record Details'}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Collection: {collection.title} • ID: {record.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {canEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(record);
                }}
                className="flex items-center space-x-1 text-xs text-indigo-400 hover:bg-zinc-800 border border-[#27272a] px-2.5 py-1.5 rounded-lg font-medium transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collection.fields.map((field) => {
              const val = record[field.name];
              return (
                <div
                  key={field.id}
                  className="p-3 rounded-lg bg-zinc-900 border border-[#27272a] space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                    <span>{field.title}</span>
                    <span className="font-mono lowercase text-[10px] text-zinc-500">
                      {field.type}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-zinc-200 break-words pt-0.5">
                    {val === undefined || val === null || val === '' ? (
                      <span className="text-zinc-600 italic">Empty</span>
                    ) : field.type === 'currency' ? (
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${Number(val).toLocaleString()}
                      </span>
                    ) : field.type === 'tags' && Array.isArray(val) ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {val.map((t, idx) => (
                          <span
                            key={idx}
                            className="bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-mono px-1.5 py-0.5 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : field.type === 'boolean' ? (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          val
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {val ? 'Enabled / True' : 'Disabled / False'}
                      </span>
                    ) : (
                      String(val)
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit Trail & Meta */}
          <div className="p-4 rounded-lg bg-zinc-900 border border-[#27272a] text-xs text-zinc-400 space-y-2">
            <div className="font-semibold text-zinc-200 flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Record Metadata & Integrity</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div>
                <span className="text-zinc-500">Created At: </span>
                <span className="text-zinc-300">{record.createdAt || '2026-08-01T10:00:00Z'}</span>
              </div>
              <div>
                <span className="text-zinc-500">Updated At: </span>
                <span className="text-zinc-300">{record.updatedAt || '2026-08-24T04:00:00Z'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#27272a] bg-zinc-900 flex items-center justify-between">
          <button
            onClick={handleCopyJson}
            className="flex items-center space-x-1.5 text-xs text-zinc-300 hover:text-white bg-zinc-900 border border-[#27272a] hover:bg-zinc-800 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON!' : 'Copy Record JSON'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 border border-[#27272a] rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
