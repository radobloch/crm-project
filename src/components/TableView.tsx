import React, { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Eye,
  Trash2,
  Edit2,
  Plus,
  MoreVertical,
  Check,
  X,
  Search,
  Settings,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Collection, CollectionField, RecordItem } from '../types';

interface TableViewProps {
  collection: Collection;
  records: RecordItem[];
  designMode: boolean;
  onEditRecord: (record: RecordItem) => void;
  onDeleteRecord: (id: string) => void;
  onViewRecord: (record: RecordItem) => void;
  onUpdateRecordField: (recordId: string, fieldName: string, value: any) => void;
  onOpenAddField: () => void;
  canEdit: boolean;
  canDelete: boolean;
  searchTerm: string;
}

export const TableView: React.FC<TableViewProps> = ({
  collection,
  records,
  designMode,
  onEditRecord,
  onDeleteRecord,
  onViewRecord,
  onUpdateRecordField,
  onOpenAddField,
  canEdit,
  canDelete,
  searchTerm,
}) => {
  // Sort state
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter state
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState<boolean>(false);

  // Hidden fields state
  const [hiddenFields, setHiddenFields] = useState<Record<string, boolean>>({});
  const [showColumnPicker, setShowColumnPicker] = useState<boolean>(false);

  // Selection
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldName: string } | null>(null);
  const [cellDraftValue, setCellDraftValue] = useState<any>('');

  // Pagination
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Visible fields
  const visibleFields = useMemo(() => {
    return collection.fields.filter((f) => !hiddenFields[f.id]);
  }, [collection.fields, hiddenFields]);

  // Filter & Sort Logic
  const filteredAndSortedRecords = useMemo(() => {
    let list = [...records];

    // Global Search Term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((rec) => {
        return Object.values(rec).some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(q);
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Specific Column Filter
    if (filterField && filterValue) {
      const fVal = filterValue.toLowerCase();
      list = list.filter((rec) => {
        const val = rec[filterField];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(fVal);
      });
    }

    // Sorting
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [records, searchTerm, filterField, filterValue, sortField, sortDirection]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRecords.slice(start, start + pageSize);
  }, [filteredAndSortedRecords, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedRecords.length / pageSize) || 1;

  const handleSort = (fieldId: string) => {
    if (sortField === fieldId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(fieldId);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedRowIds.length === paginatedRecords.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(paginatedRecords.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const startInlineEdit = (recordId: string, field: CollectionField, currentVal: any) => {
    if (!canEdit) return;
    setEditingCell({ recordId, fieldName: field.name });
    setCellDraftValue(currentVal ?? '');
  };

  const saveInlineEdit = () => {
    if (editingCell) {
      onUpdateRecordField(editingCell.recordId, editingCell.fieldName, cellDraftValue);
      setEditingCell(null);
    }
  };

  // Render cell formatting based on field type
  const renderCellContent = (record: RecordItem, field: CollectionField) => {
    const val = record[field.name];
    const isEditing =
      editingCell?.recordId === record.id && editingCell?.fieldName === field.name;

    if (isEditing) {
      if (field.type === 'select' && field.options) {
        return (
          <select
            autoFocus
            value={cellDraftValue}
            onChange={(e) => setCellDraftValue(e.target.value)}
            onBlur={saveInlineEdit}
            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()}
            className="text-xs border border-indigo-500 rounded px-1.5 py-0.5 bg-zinc-900 text-zinc-100 shadow-sm outline-none"
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      if (field.type === 'boolean') {
        return (
          <input
            type="checkbox"
            autoFocus
            checked={!!cellDraftValue}
            onChange={(e) => setCellDraftValue(e.target.checked)}
            onBlur={saveInlineEdit}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700"
          />
        );
      }

      return (
        <input
          type={field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
          autoFocus
          value={cellDraftValue}
          onChange={(e) =>
            setCellDraftValue(
              field.type === 'number' || field.type === 'currency'
                ? Number(e.target.value)
                : e.target.value
            )
          }
          onBlur={saveInlineEdit}
          onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit()}
          className="text-xs border border-indigo-500 rounded px-1.5 py-0.5 w-full bg-zinc-900 text-zinc-100 shadow-sm outline-none"
        />
      );
    }

    if (val === undefined || val === null || val === '') {
      return <span className="text-zinc-600 italic text-xs">-</span>;
    }

    switch (field.type) {
      case 'select': {
        const option = field.options?.find((o) => o.value === val);
        return (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border"
            style={{
              backgroundColor: option?.color ? `${option.color}18` : '#27272a',
              color: option?.color || '#d4d4d8',
              borderColor: option?.color ? `${option.color}40` : '#3f3f46',
            }}
          >
            {option?.label || String(val)}
          </span>
        );
      }

      case 'currency':
        return (
          <span className="font-mono font-medium text-emerald-400">
            ${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </span>
        );

      case 'percent':
        return (
          <div className="flex items-center space-x-1.5">
            <div className="w-12 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, Number(val)))}%` }}
              />
            </div>
            <span className="text-xs font-mono text-zinc-400">{val}%</span>
          </div>
        );

      case 'tags': {
        const tags = Array.isArray(val) ? val : [val];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((t, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px] font-mono border border-[#27272a]"
              >
                #{t}
              </span>
            ))}
          </div>
        );
      }

      case 'rating': {
        const rating = Number(val);
        return (
          <div className="flex items-center space-x-1">
            <span className="text-amber-400 text-xs">★</span>
            <span className="text-xs font-semibold text-zinc-200">{rating.toFixed(1)}</span>
          </div>
        );
      }

      case 'boolean':
        return val ? (
          <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center text-[11px] text-zinc-400 font-medium bg-zinc-800/80 px-1.5 py-0.5 rounded border border-[#27272a]">
            No
          </span>
        );

      case 'user':
        return (
          <div className="flex items-center space-x-1.5">
            <div className="w-5 h-5 rounded-full bg-indigo-900/60 text-indigo-300 flex items-center justify-center text-[10px] font-bold border border-indigo-700/50">
              {String(val).charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-zinc-300 font-medium">{String(val)}</span>
          </div>
        );

      case 'date':
        return (
          <span className="text-xs font-mono text-zinc-400">
            {String(val).slice(0, 10)}
          </span>
        );

      case 'longtext':
        return (
          <span className="text-xs text-zinc-400 truncate max-w-xs block" title={String(val)}>
            {String(val)}
          </span>
        );

      default:
        return <span className="text-xs text-zinc-200 font-normal">{String(val)}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-[#fafafa]">
      {/* Design Mode Banner (NocoBase Visual Block Customizer) */}
      {designMode && (
        <div className="bg-amber-950/30 border-b border-amber-800/40 px-4 py-2 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span className="font-semibold">NocoBase Table Block Designer:</span>
            <span>Configure fields, visibility, order, and relational actions</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="bg-zinc-900 border border-amber-500/40 text-amber-300 hover:bg-zinc-800 px-2 py-1 rounded text-xs font-medium"
            >
              Toggle Columns ({visibleFields.length}/{collection.fields.length})
            </button>
            <button
              onClick={onOpenAddField}
              className="bg-amber-600 hover:bg-amber-700 text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 shadow-xs"
            >
              <Plus className="w-3 h-3" />
              <span>Add Field to Table</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Action Bar */}
      <div className="p-3 border-b border-[#27272a] flex flex-wrap items-center justify-between gap-2 bg-[#09090b]">
        <div className="flex items-center space-x-2">
          {/* Filter Trigger Button */}
          <button
            onClick={() => setShowFilterBar(!showFilterBar)}
            className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
              showFilterBar || filterValue
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-medium'
                : 'bg-zinc-900 border-[#27272a] text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {filterValue && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
          </button>

          {/* Column Visibility Selector */}
          <div className="relative">
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className="flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-md bg-zinc-900 border border-[#27272a] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Fields</span>
              <span className="text-[10px] text-zinc-500">({visibleFields.length})</span>
            </button>

            {showColumnPicker && (
              <div className="absolute left-0 mt-1 w-56 bg-zinc-900 border border-[#27272a] rounded-lg shadow-xl z-20 p-2 text-xs space-y-1">
                <div className="font-semibold text-zinc-200 pb-1 border-b border-[#27272a] mb-1 flex items-center justify-between">
                  <span>Display Columns</span>
                  <button
                    onClick={() => setHiddenFields({})}
                    className="text-[10px] text-indigo-400 hover:underline"
                  >
                    Reset All
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {collection.fields.map((field) => {
                    const isVisible = !hiddenFields[field.id];
                    return (
                      <label
                        key={field.id}
                        className="flex items-center space-x-2 px-1.5 py-1 hover:bg-zinc-800 rounded cursor-pointer text-zinc-300"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={(e) => {
                            setHiddenFields((prev) => ({
                              ...prev,
                              [field.id]: !e.target.checked,
                            }));
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700 w-3.5 h-3.5"
                        />
                        <span className="truncate">{field.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selected Count & Bulk Actions */}
          {selectedRowIds.length > 0 && (
            <div className="flex items-center space-x-2 pl-2 border-l border-[#27272a] text-xs">
              <span className="text-zinc-300 font-medium">
                {selectedRowIds.length} selected
              </span>
              {canDelete && (
                <button
                  onClick={() => {
                    if (confirm(`Delete ${selectedRowIds.length} selected records?`)) {
                      selectedRowIds.forEach((id) => onDeleteRecord(id));
                      setSelectedRowIds([]);
                    }
                  }}
                  className="flex items-center space-x-1 text-red-400 hover:bg-red-500/10 px-2 py-1 rounded border border-red-500/30"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Selected</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Info: Total Count */}
        <div className="text-xs text-zinc-400">
          Showing <span className="font-semibold text-zinc-200">{filteredAndSortedRecords.length}</span> records
        </div>
      </div>

      {/* Dynamic Filter Sub-Bar */}
      {showFilterBar && (
        <div className="px-4 py-2.5 bg-zinc-900 border-b border-[#27272a] flex items-center space-x-2 text-xs">
          <span className="text-zinc-400 font-medium">Where:</span>
          <select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs outline-none text-zinc-200"
          >
            <option value="">-- Choose Column --</option>
            {collection.fields.map((f) => (
              <option key={f.id} value={f.name}>
                {f.title}
              </option>
            ))}
          </select>
          <span className="text-zinc-500">contains</span>
          <input
            type="text"
            placeholder="Type value to match..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-xs outline-none text-zinc-200 w-48 placeholder:text-zinc-500"
          />
          {filterValue && (
            <button
              onClick={() => {
                setFilterField('');
                setFilterValue('');
              }}
              className="text-zinc-400 hover:text-zinc-200 text-xs px-1"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Scrollable Data Table */}
      <div className="flex-1 overflow-auto border-b border-[#27272a]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/90 border-b border-[#27272a] text-[11px] font-semibold uppercase tracking-wider text-zinc-400 sticky top-0 z-10 select-none backdrop-blur-xs">
              {/* Checkbox Column */}
              <th className="w-10 px-3 py-2.5 bg-zinc-900">
                <input
                  type="checkbox"
                  checked={
                    paginatedRecords.length > 0 &&
                    selectedRowIds.length === paginatedRecords.length
                  }
                  onChange={handleSelectAll}
                  className="rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700 w-3.5 h-3.5"
                />
              </th>

              {/* Data Headers */}
              {visibleFields.map((field) => {
                const isSorted = sortField === field.name;
                return (
                  <th
                    key={field.id}
                    className="px-3 py-2.5 font-semibold text-zinc-300 whitespace-nowrap group hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    onClick={() => handleSort(field.name)}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{field.title}</span>
                      <span className="text-[9px] text-zinc-500 font-mono font-normal">
                        ({field.type})
                      </span>
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-indigo-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-indigo-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Actions Column Header */}
              <th className="w-24 px-3 py-2.5 text-right font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#27272a]/60 text-xs">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleFields.length + 2}
                  className="text-center py-16 text-zinc-500"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="w-8 h-8 text-zinc-600 stroke-1" />
                    <p className="font-medium text-zinc-300">No records found matching criteria</p>
                    <p className="text-xs text-zinc-500">
                      Try clearing filters or add a new record to this collection.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => {
                const isSelected = selectedRowIds.includes(record.id);
                return (
                  <tr
                    key={record.id}
                    className={`hover:bg-zinc-800/40 transition-colors group ${
                      isSelected ? 'bg-indigo-950/30' : ''
                    }`}
                  >
                    {/* Checkbox Cell */}
                    <td className="px-3 py-2.5 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(record.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700 w-3.5 h-3.5"
                      />
                    </td>

                    {/* Data Cells */}
                    {visibleFields.map((field) => (
                      <td
                        key={field.id}
                        onDoubleClick={() =>
                          startInlineEdit(record.id, field, record[field.name])
                        }
                        className="px-3 py-2.5 text-zinc-300 whitespace-nowrap cursor-pointer hover:bg-zinc-800/60 transition-colors"
                        title="Double-click to edit cell inline"
                      >
                        {renderCellContent(record, field)}
                      </td>
                    ))}

                    {/* Row Action Buttons */}
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => onViewRecord(record)}
                          className="p-1 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 rounded transition-colors"
                          title="View Details & Relations"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => onEditRecord(record)}
                            className="p-1 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors"
                            title="Edit Record Form"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this record permanently?')) {
                                onDeleteRecord(record.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer controls */}
      <div className="p-3 border-t border-[#27272a] bg-[#09090b] flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center space-x-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-[#27272a] rounded px-1.5 py-0.5 text-xs bg-zinc-900 text-zinc-200 outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <span>
            Page <span className="font-semibold text-zinc-200">{currentPage}</span> of{' '}
            <span className="font-semibold text-zinc-200">{totalPages}</span>
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-[#27272a] hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-[#27272a] hover:bg-zinc-800 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
