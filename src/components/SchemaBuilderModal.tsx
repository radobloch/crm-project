import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Database,
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Hash,
  Type,
  AlignLeft,
  Calendar,
  DollarSign,
  Percent,
  List,
  Tags,
  ToggleLeft,
  User,
  Star,
  Key,
} from 'lucide-react';
import { Collection, CollectionField, FieldType } from '../types';

interface SchemaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onAddCollection: (newCol: Collection) => void;
  onUpdateCollectionFields: (collectionId: string, fields: CollectionField[]) => void;
  onDeleteCollection: (collectionId: string) => void;
}

const FIELD_TYPES: { type: FieldType; label: string; icon: any; desc: string }[] = [
  { type: 'text', label: 'Single Line Text', icon: Type, desc: 'Short strings, titles, names, codes' },
  { type: 'longtext', label: 'Long Text / Markdown', icon: AlignLeft, desc: 'Descriptions, notes, formatted copy' },
  { type: 'select', label: 'Single Select', icon: List, desc: 'Dropdown enum options with color tags' },
  { type: 'number', label: 'Integer / Float', icon: Hash, desc: 'Numeric values, points, quantities' },
  { type: 'currency', label: 'Currency ($)', icon: DollarSign, desc: 'Monetary amounts with currency formatting' },
  { type: 'percent', label: 'Percentage (%)', icon: Percent, desc: 'Values from 0 to 100 with progress bar' },
  { type: 'date', label: 'Date', icon: Calendar, desc: 'Calendar date (YYYY-MM-DD)' },
  { type: 'boolean', label: 'Boolean / Switch', icon: ToggleLeft, desc: 'True/False checkbox toggle' },
  { type: 'tags', label: 'Tags / Multi-Badge', icon: Tags, desc: 'Array of categorized tag chips' },
  { type: 'user', label: 'User / Assignee', icon: User, desc: 'Platform team member avatar' },
  { type: 'rating', label: 'Rating (Stars)', icon: Star, desc: '1 to 5 star rating value' },
];

export const SchemaBuilderModal: React.FC<SchemaBuilderModalProps> = ({
  isOpen,
  onClose,
  collections,
  onAddCollection,
  onUpdateCollectionFields,
  onDeleteCollection,
}) => {
  const [selectedColId, setSelectedColId] = useState<string>(collections[0]?.id || '');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // New Collection Form state
  const [newColTitle, setNewColTitle] = useState('');
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColCategory, setNewColCategory] = useState('Custom');

  // Add Field Form state
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldTitle, setNewFieldTitle] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<FieldType>('text');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldOptionsStr, setNewFieldOptionsStr] = useState('Option A, Option B, Option C');

  if (!isOpen) return null;

  const currentCollection = collections.find((c) => c.id === selectedColId) || collections[0];

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle) return;

    const name = newColName.toLowerCase().replace(/[^a-z0-9_]/g, '_') || newColTitle.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const id = `col_${Date.now()}`;

    const newCol: Collection = {
      id,
      name,
      title: newColTitle,
      category: newColCategory,
      description: newColDesc || 'Custom data collection',
      icon: 'Database',
      createdAt: new Date().toISOString(),
      fields: [
        { id: 'title', name: 'title', title: `${newColTitle} Name`, type: 'text', required: true, isPrimary: true },
        { id: 'description', name: 'description', title: 'Description', type: 'longtext' },
        { id: 'status', name: 'status', title: 'Status', type: 'select', options: [
          { label: 'Pending', value: 'pending', color: '#f59e0b' },
          { label: 'Active', value: 'active', color: '#10b981' },
          { label: 'Archived', value: 'archived', color: '#64748b' },
        ], defaultValue: 'pending' },
      ],
    };

    onAddCollection(newCol);
    setSelectedColId(id);
    setIsCreatingCollection(false);
    setNewColTitle('');
    setNewColName('');
    setNewColDesc('');
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldTitle || !currentCollection) return;

    const name = newFieldName.toLowerCase().replace(/[^a-z0-9_]/g, '_') || newFieldTitle.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const id = `fld_${Date.now()}`;

    let options = undefined;
    if (newFieldType === 'select' || newFieldType === 'tags') {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
      options = newFieldOptionsStr.split(',').map((s, idx) => {
        const trimmed = s.trim();
        return {
          label: trimmed,
          value: trimmed.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          color: colors[idx % colors.length],
        };
      }).filter((o) => o.label.length > 0);
    }

    const newField: CollectionField = {
      id,
      name,
      title: newFieldTitle,
      type: newFieldType,
      required: newFieldRequired,
      options,
    };

    const updatedFields = [...currentCollection.fields, newField];
    onUpdateCollectionFields(currentCollection.id, updatedFields);

    setIsAddingField(false);
    setNewFieldTitle('');
    setNewFieldName('');
    setNewFieldRequired(false);
  };

  const handleDeleteField = (fieldId: string) => {
    if (!currentCollection) return;
    const field = currentCollection.fields.find((f) => f.id === fieldId);
    if (field?.isPrimary) {
      alert('Cannot delete primary identity field.');
      return;
    }
    if (confirm(`Remove field "${field?.title}" from collection schema?`)) {
      const updated = currentCollection.fields.filter((f) => f.id !== fieldId);
      onUpdateCollectionFields(currentCollection.id, updated);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#09090b] text-[#fafafa] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-zinc-900 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                NocoBase Data Model & Collections Architect
              </h3>
              <p className="text-xs text-zinc-400">
                Define relational tables, typed field schemas, constraints, and validation rules
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

        {/* Master-Detail Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Collections List */}
          <div className="w-64 border-r border-[#27272a] bg-zinc-950 p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-2">
                Active Collections ({collections.length})
              </div>

              <div className="space-y-1 overflow-y-auto max-h-[50vh]">
                {collections.map((col) => {
                  const isSelected = selectedColId === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => {
                        setSelectedColId(col.id);
                        setIsCreatingCollection(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-zinc-300 hover:bg-zinc-900'
                      }`}
                    >
                      <span className="truncate">{col.title}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-indigo-700 text-white' : 'text-zinc-500 bg-zinc-900 border border-zinc-800'
                        }`}
                      >
                        {col.fields.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setIsCreatingCollection(true)}
              className="w-full mt-3 py-2 px-3 rounded-lg border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:bg-zinc-900 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Collection</span>
            </button>
          </div>

          {/* Right: Collection Schema Fields Inspector */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#09090b]">
            {isCreatingCollection ? (
              /* Create Collection View */
              <div className="max-w-xl mx-auto space-y-4">
                <div className="border-b border-[#27272a] pb-3">
                  <h4 className="text-sm font-bold text-zinc-100">Create New Collection</h4>
                  <p className="text-xs text-zinc-400">
                    Creates an isolated data table with schema definitions and automated REST endpoints.
                  </p>
                </div>

                <form onSubmit={handleCreateCollection} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Collection Display Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Invoices, Tickets, Projects"
                      value={newColTitle}
                      onChange={(e) => {
                        setNewColTitle(e.target.value);
                        if (!newColName) {
                          setNewColName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                        }
                      }}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#27272a] bg-zinc-900 text-zinc-100 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Database Table Name (SQL Key) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. invoices"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#27272a] bg-zinc-900 text-zinc-100 font-mono focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Finance, Operations"
                      value={newColCategory}
                      onChange={(e) => setNewColCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#27272a] bg-zinc-900 text-zinc-100 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Short description of this collection..."
                      value={newColDesc}
                      onChange={(e) => setNewColDesc(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#27272a] bg-zinc-900 text-zinc-100 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                    >
                      Save Collection
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCollection(false)}
                      className="px-4 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : currentCollection ? (
              /* Collection Fields Editor */
              <div className="space-y-6">
                {/* Collection Meta Top */}
                <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-zinc-100">{currentCollection.title}</h4>
                      <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-[#27272a]">
                        table: {currentCollection.name}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{currentCollection.description}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsAddingField(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Field</span>
                    </button>

                    {collections.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete collection "${currentCollection.title}" completely?`)) {
                            onDeleteCollection(currentCollection.id);
                            setSelectedColId(collections.find((c) => c.id !== currentCollection.id)?.id || '');
                          }
                        }}
                        className="text-red-400 hover:bg-red-950/30 p-1.5 rounded-lg border border-red-500/30 transition-colors"
                        title="Delete Entire Collection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Add Field Sub-Form */}
                {isAddingField && (
                  <div className="p-4 rounded-xl bg-zinc-900 border border-[#27272a] space-y-4">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-zinc-100">Add Field to Schema</h5>
                      <button
                        onClick={() => setIsAddingField(false)}
                        className="text-zinc-400 hover:text-zinc-200 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={handleAddField} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                            Field Label / Title *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Due Date, Total Budget"
                            value={newFieldTitle}
                            onChange={(e) => {
                              setNewFieldTitle(e.target.value);
                              if (!newFieldName) {
                                setNewFieldName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                              }
                            }}
                            className="w-full text-xs p-2 rounded-lg border border-[#27272a] bg-zinc-950 text-zinc-100 outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                            Field Key Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. due_date"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className="w-full text-xs p-2 rounded-lg border border-[#27272a] font-mono bg-zinc-950 text-zinc-100 outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>

                      {/* Field Type Radio Grid */}
                      <div>
                        <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                          Field Type
                        </label>
                        <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1.5 bg-zinc-950 rounded-lg border border-[#27272a]">
                          {FIELD_TYPES.map((ft) => {
                            const Icon = ft.icon;
                            const isSelected = newFieldType === ft.type;
                            return (
                              <button
                                type="button"
                                key={ft.type}
                                onClick={() => setNewFieldType(ft.type)}
                                className={`text-left p-2 rounded-md border text-xs transition-colors flex flex-col justify-between ${
                                  isSelected
                                    ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-300 font-medium'
                                    : 'border-zinc-800/80 hover:bg-zinc-900 text-zinc-300'
                                }`}
                              >
                                <div className="flex items-center space-x-1.5 mb-1">
                                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="font-semibold text-[11px]">{ft.label}</span>
                                </div>
                                <span className="text-[10px] text-zinc-500 line-clamp-1">{ft.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Select / Tags Options list input */}
                      {(newFieldType === 'select' || newFieldType === 'tags') && (
                        <div>
                          <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                            Dropdown Options (Comma separated)
                          </label>
                          <input
                            type="text"
                            value={newFieldOptionsStr}
                            onChange={(e) => setNewFieldOptionsStr(e.target.value)}
                            placeholder="Low, Medium, High"
                            className="w-full text-xs p-2 rounded-lg border border-[#27272a] bg-zinc-950 text-zinc-100 outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newFieldRequired}
                            onChange={(e) => setNewFieldRequired(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 bg-zinc-900 border-zinc-700"
                          />
                          <span>Required field (cannot be null)</span>
                        </label>

                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Append Field
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Fields Table */}
                <div className="border border-[#27272a] rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900 border-b border-[#27272a] text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Field Title</th>
                        <th className="px-4 py-2.5">Key Name</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Constraints</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#27272a]">
                      {currentCollection.fields.map((f) => {
                        return (
                          <tr key={f.id} className="hover:bg-zinc-900/50 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-zinc-200 flex items-center space-x-2">
                              {f.isPrimary && <Key className="w-3.5 h-3.5 text-amber-400" />}
                              <span>{f.title}</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-zinc-400 text-[11px]">
                              {f.name}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[10px] border border-[#27272a]">
                                {f.type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 space-x-1">
                              {f.required && (
                                <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                                  Required
                                </span>
                              )}
                              {f.isPrimary && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  Primary Key
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {!f.isPrimary && (
                                <button
                                  onClick={() => handleDeleteField(f.id)}
                                  className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                                  title="Delete Field"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#27272a] bg-zinc-900 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
