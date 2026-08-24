import React, { useState, useMemo } from 'react';
import { Plus, MoreHorizontal, User, DollarSign, Calendar, Tag, Layers } from 'lucide-react';
import { Collection, CollectionField, RecordItem } from '../types';

interface KanbanViewProps {
  collection: Collection;
  records: RecordItem[];
  designMode: boolean;
  onEditRecord: (record: RecordItem) => void;
  onDeleteRecord: (id: string) => void;
  onViewRecord: (record: RecordItem) => void;
  onUpdateRecordField: (recordId: string, fieldName: string, value: any) => void;
  onNewRecordWithDefaults?: (defaults: Partial<RecordItem>) => void;
  canEdit: boolean;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  collection,
  records,
  designMode,
  onEditRecord,
  onDeleteRecord,
  onViewRecord,
  onUpdateRecordField,
  onNewRecordWithDefaults,
  canEdit,
}) => {
  // Find select fields that can be used for grouping
  const selectFields = useMemo(() => {
    return collection.fields.filter((f) => f.type === 'select' && f.options && f.options.length > 0);
  }, [collection.fields]);

  const [groupFieldId, setGroupFieldId] = useState<string>(
    selectFields[0]?.id || ''
  );

  const activeGroupField = useMemo(() => {
    return collection.fields.find((f) => f.id === groupFieldId) || selectFields[0];
  }, [collection.fields, groupFieldId, selectFields]);

  // Primary field (for card title)
  const primaryField = useMemo(() => {
    return collection.fields.find((f) => f.isPrimary) || collection.fields[0];
  }, [collection.fields]);

  // If no select field found
  if (!activeGroupField || !activeGroupField.options) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white h-full flex flex-col items-center justify-center">
        <Layers className="w-12 h-12 text-slate-300 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">No Grouping Field Available</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Kanban boards require at least one Single Select or Status field in this collection to group columns.
        </p>
      </div>
    );
  }

  const columns = activeGroupField.options;

  // Group records by option value
  const groupedRecords = useMemo(() => {
    const map: Record<string, RecordItem[]> = {};
    columns.forEach((col) => {
      map[col.value] = [];
    });

    records.forEach((rec) => {
      const val = rec[activeGroupField.name];
      if (val && map[val]) {
        map[val].push(rec);
      } else if (columns[0]) {
        // Default or unassigned
        map[columns[0].value]?.push(rec);
      }
    });

    return map;
  }, [records, activeGroupField, columns]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnValue: string) => {
    e.preventDefault();
    const recordId = e.dataTransfer.getData('text/plain');
    if (recordId && canEdit) {
      onUpdateRecordField(recordId, activeGroupField.name, targetColumnValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Kanban Header Bar */}
      <div className="p-3 bg-[#09090b] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-zinc-400">Group By Field:</span>
          <select
            value={activeGroupField.id}
            onChange={(e) => setGroupFieldId(e.target.value)}
            className="text-xs bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 font-medium text-zinc-200 outline-none"
          >
            {selectFields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title} ({f.name})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-zinc-400">
          Total Cards: <span className="font-semibold text-zinc-200">{records.length}</span>
        </div>
      </div>

      {/* Columns Horizontal Scroll Board */}
      <div className="flex-1 overflow-x-auto p-4 flex space-x-4">
        {columns.map((col) => {
          const colRecords = groupedRecords[col.value] || [];
          // Calculate column total if there is currency field
          const currencyField = collection.fields.find((f) => f.type === 'currency');
          const colTotalValue = currencyField
            ? colRecords.reduce((acc, curr) => acc + (Number(curr[currencyField.name]) || 0), 0)
            : 0;

          return (
            <div
              key={col.value}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.value)}
              className="w-80 shrink-0 bg-zinc-900/70 rounded-xl flex flex-col max-h-full border border-[#27272a] shadow-md"
            >
              {/* Column Header */}
              <div className="p-3 flex items-center justify-between border-b border-[#27272a] bg-zinc-900/90 rounded-t-xl">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: col.color || '#71717a' }}
                  />
                  <span className="font-semibold text-zinc-200 text-xs">{col.label}</span>
                  <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-zinc-700/50">
                    {colRecords.length}
                  </span>
                </div>

                {currencyField && colTotalValue > 0 && (
                  <span className="text-[11px] font-mono font-medium text-emerald-400">
                    ${colTotalValue.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Card List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
                {colRecords.map((rec) => {
                  return (
                    <div
                      key={rec.id}
                      draggable={canEdit}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', rec.id)}
                      onClick={() => onViewRecord(rec)}
                      className="bg-zinc-900/90 p-3 rounded-lg border border-[#27272a] shadow-xs hover:shadow-lg hover:border-zinc-700 transition-all cursor-pointer group select-none relative"
                    >
                      {/* Card Title */}
                      <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {rec[primaryField?.name || 'title'] || 'Untitled Card'}
                      </h4>

                      {/* Additional Attributes Display */}
                      <div className="mt-2.5 space-y-1.5 text-[11px] text-zinc-400">
                        {/* Company / Subtitle */}
                        {rec.company && (
                          <div className="text-zinc-400 font-medium truncate">
                            🏢 {rec.company}
                          </div>
                        )}

                        {/* Priority / Badges */}
                        {rec.priority && (
                          <div className="inline-block">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                rec.priority === 'high' || rec.priority === 'p0'
                                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                  : rec.priority === 'medium' || rec.priority === 'p1'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50'
                              }`}
                            >
                              {String(rec.priority)}
                            </span>
                          </div>
                        )}

                        {/* Story Points or Quantity */}
                        {rec.story_points !== undefined && (
                          <span className="ml-1.5 bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-blue-500/20">
                            {rec.story_points} pts
                          </span>
                        )}

                        {/* SKU or Price */}
                        {rec.price !== undefined && (
                          <div className="font-mono font-bold text-zinc-200">
                            ${Number(rec.price).toLocaleString()}
                          </div>
                        )}

                        {rec.value !== undefined && (
                          <div className="font-mono font-semibold text-emerald-400">
                            ${Number(rec.value).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Assignee & Date */}
                      <div className="mt-3 pt-2 border-t border-[#27272a]/60 flex items-center justify-between text-[11px] text-zinc-400">
                        {rec.owner || rec.assignee ? (
                          <div className="flex items-center space-x-1.5">
                            <div className="w-4 h-4 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center text-[9px] font-bold border border-indigo-700/50">
                              {String(rec.owner || rec.assignee).charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[100px] text-zinc-300">
                              {rec.owner || rec.assignee}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">Unassigned</span>
                        )}

                        {rec.due_date || rec.close_date ? (
                          <div className="flex items-center space-x-1 font-mono text-[10px] text-zinc-500">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            <span>{(rec.due_date || rec.close_date).slice(5)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {colRecords.length === 0 && (
                  <div className="border border-dashed border-zinc-800 rounded-lg p-6 text-center text-zinc-500 text-xs">
                    Drop cards here
                  </div>
                )}
              </div>

              {/* Add card quick button */}
              {canEdit && onNewRecordWithDefaults && (
                <div className="p-2 border-t border-[#27272a] bg-zinc-900/40 rounded-b-xl">
                  <button
                    onClick={() =>
                      onNewRecordWithDefaults({
                        [activeGroupField.name]: col.value,
                      })
                    }
                    className="w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded font-medium flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to {col.label}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
