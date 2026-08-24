import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Sparkles } from 'lucide-react';
import { Collection, CollectionField, RecordItem } from '../types';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Collection;
  recordToEdit: RecordItem | null;
  onSave: (recordData: Partial<RecordItem>) => void;
  defaultValues?: Partial<RecordItem>;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  collection,
  recordToEdit,
  onSave,
  defaultValues,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (recordToEdit) {
        setFormData({ ...recordToEdit });
      } else {
        const initial: Record<string, any> = {};
        collection.fields.forEach((field) => {
          if (defaultValues && defaultValues[field.name] !== undefined) {
            initial[field.name] = defaultValues[field.name];
          } else if (field.defaultValue !== undefined) {
            initial[field.name] = field.defaultValue;
          } else if (field.type === 'boolean') {
            initial[field.name] = false;
          } else if (field.type === 'tags') {
            initial[field.name] = [];
          } else if (field.type === 'number' || field.type === 'currency' || field.type === 'percent') {
            initial[field.name] = 0;
          } else {
            initial[field.name] = '';
          }
        });
        setFormData(initial);
      }
      setErrors({});
    }
  }, [isOpen, recordToEdit, collection, defaultValues]);

  if (!isOpen) return null;

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[fieldName];
        return copy;
      });
    }
  };

  const handleTagToggle = (fieldName: string, tagValue: string) => {
    const currentTags: string[] = Array.isArray(formData[fieldName]) ? formData[fieldName] : [];
    const newTags = currentTags.includes(tagValue)
      ? currentTags.filter((t) => t !== tagValue)
      : [...currentTags, tagValue];
    handleChange(fieldName, newTags);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: Record<string, string> = {};
    collection.fields.forEach((field) => {
      if (field.required) {
        const val = formData[field.name];
        if (val === undefined || val === null || val === '') {
          newErrors[field.name] = `${field.title} is required`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#09090b] text-[#fafafa] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-zinc-900">
          <div>
            <h3 className="text-base font-bold text-zinc-100">
              {recordToEdit ? 'Edit Record' : 'Create New Record'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Collection: <span className="font-semibold text-zinc-200">{collection.title}</span> ({collection.name})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {collection.fields.map((field) => {
              const val = formData[field.name] ?? '';
              const error = errors[field.name];

              return (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center space-x-1">
                      <span>{field.title}</span>
                      {field.required && <span className="text-red-400 font-bold">*</span>}
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {field.type}
                    </span>
                  </div>

                  {/* Render input by type */}
                  {field.type === 'longtext' ? (
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      placeholder={`Enter ${field.title.toLowerCase()}...`}
                      className={`w-full text-xs p-2.5 rounded-lg border outline-none transition-all placeholder:text-zinc-600 bg-zinc-900 text-zinc-100 ${
                        error
                          ? 'border-red-500/50 bg-red-950/20 focus:border-red-500'
                          : 'border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={val}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className={`w-full text-xs p-2.5 rounded-lg border bg-zinc-900 text-zinc-100 outline-none transition-all ${
                        error
                          ? 'border-red-500/50 focus:border-red-500'
                          : 'border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    >
                      <option value="">-- Select option --</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'boolean' ? (
                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="checkbox"
                        id={`bool-${field.id}`}
                        checked={!!val}
                        onChange={(e) => handleChange(field.name, e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-700 cursor-pointer"
                      />
                      <label
                        htmlFor={`bool-${field.id}`}
                        className="text-xs text-zinc-300 cursor-pointer select-none"
                      >
                        Enable / Yes
                      </label>
                    </div>
                  ) : field.type === 'tags' ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5">
                        {field.options?.map((opt) => {
                          const isSelected = Array.isArray(val) && val.includes(opt.value);
                          return (
                            <button
                              type="button"
                              key={opt.value}
                              onClick={() => handleTagToggle(field.name, opt.value)}
                              className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                                  : 'bg-zinc-900 text-zinc-300 border-[#27272a] hover:bg-zinc-800'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <input
                      type={
                        field.type === 'number' || field.type === 'currency' || field.type === 'percent'
                          ? 'number'
                          : field.type === 'date'
                          ? 'date'
                          : 'text'
                      }
                      value={val}
                      onChange={(e) =>
                        handleChange(
                          field.name,
                          field.type === 'number' || field.type === 'currency' || field.type === 'percent'
                            ? Number(e.target.value)
                            : e.target.value
                        )
                      }
                      placeholder={`Enter ${field.title.toLowerCase()}...`}
                      className={`w-full text-xs p-2.5 rounded-lg border outline-none transition-all placeholder:text-zinc-600 bg-zinc-900 text-zinc-100 ${
                        error
                          ? 'border-red-500/50 bg-red-950/20 focus:border-red-500'
                          : 'border-[#27272a] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                      }`}
                    />
                  )}

                  {error && (
                    <p className="text-[11px] text-red-400 flex items-center space-x-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{error}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 border-t border-[#27272a] bg-zinc-900 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{recordToEdit ? 'Save Changes' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
