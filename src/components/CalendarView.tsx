import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';
import { Collection, RecordItem } from '../types';

interface CalendarViewProps {
  collection: Collection;
  records: RecordItem[];
  onViewRecord: (record: RecordItem) => void;
  onNewRecordWithDefaults?: (defaults: Partial<RecordItem>) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  collection,
  records,
  onViewRecord,
  onNewRecordWithDefaults,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 24)); // August 2026

  // Find date fields
  const dateFields = useMemo(() => {
    return collection.fields.filter((f) => f.type === 'date' || f.type === 'datetime');
  }, [collection.fields]);

  const [activeDateFieldId, setActiveDateFieldId] = useState<string>(
    dateFields[0]?.id || 'createdAt'
  );

  const activeDateField = useMemo(() => {
    return collection.fields.find((f) => f.id === activeDateFieldId) || dateFields[0];
  }, [collection.fields, activeDateFieldId, dateFields]);

  const primaryField = useMemo(() => {
    return collection.fields.find((f) => f.isPrimary) || collection.fields[0];
  }, [collection.fields]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calculate calendar grid days
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty previous month padding
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ day: null, dateStr: null });
    }

    // Days of current month
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr: dStr });
    }

    return days;
  }, [year, month]);

  // Group records by active date field
  const recordsByDate = useMemo(() => {
    const map: Record<string, RecordItem[]> = {};
    const dateFieldName = activeDateField ? activeDateField.name : 'createdAt';

    records.forEach((rec) => {
      const val = rec[dateFieldName];
      if (val) {
        const dStr = String(val).slice(0, 10);
        if (!map[dStr]) map[dStr] = [];
        map[dStr].push(rec);
      }
    });

    return map;
  }, [records, activeDateField]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const setToday = () => {
    setCurrentDate(new Date(2026, 7, 24));
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-[#fafafa]">
      {/* Calendar Top Controls */}
      <div className="p-3 border-b border-[#27272a] flex items-center justify-between bg-[#09090b]">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={prevMonth}
              className="p-1 rounded border border-[#27272a] hover:bg-zinc-800 bg-zinc-900 text-zinc-300"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-300" />
            </button>
            <button
              onClick={setToday}
              className="px-2.5 py-1 text-xs font-semibold rounded border border-[#27272a] hover:bg-zinc-800 bg-zinc-900 text-zinc-200"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 rounded border border-[#27272a] hover:bg-zinc-800 bg-zinc-900 text-zinc-300"
            >
              <ChevronRight className="w-4 h-4 text-zinc-300" />
            </button>
          </div>

          <h2 className="text-sm font-bold text-zinc-100 tracking-tight">
            {monthNames[month]} {year}
          </h2>
        </div>

        {/* Date Field Selector */}
        {dateFields.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-400 font-medium">Mapped Date Field:</span>
            <select
              value={activeDateField?.id}
              onChange={(e) => setActiveDateFieldId(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs font-medium text-zinc-200 outline-none"
            >
              {dateFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-[#27272a] bg-zinc-900 text-center py-2 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
        {daysOfWeek.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#27272a]/60 gap-px overflow-y-auto">
        {calendarDays.map((item, idx) => {
          if (!item.dateStr) {
            return <div key={`empty-${idx}`} className="bg-zinc-950/80 min-h-[100px]" />;
          }

          const dayRecords = recordsByDate[item.dateStr] || [];
          const isToday = item.dateStr === '2026-08-24';

          return (
            <div
              key={item.dateStr}
              className={`bg-[#09090b] p-1.5 min-h-[110px] flex flex-col transition-colors hover:bg-zinc-900/60 ${
                isToday ? 'bg-zinc-900/40' : ''
              }`}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    isToday
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-zinc-400'
                  }`}
                >
                  {item.day}
                </span>

                {onNewRecordWithDefaults && activeDateField && (
                  <button
                    onClick={() =>
                      onNewRecordWithDefaults({
                        [activeDateField.name]: item.dateStr,
                      })
                    }
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-zinc-500 hover:text-indigo-400 p-0.5 rounded"
                    title="Add record for this date"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Records on this day */}
              <div className="space-y-1 overflow-y-auto max-h-[85px]">
                {dayRecords.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => onViewRecord(rec)}
                    className="w-full text-left px-1.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] text-[11px] text-zinc-200 font-medium truncate block transition-colors"
                  >
                    {rec[primaryField?.name || 'title'] || 'Untitled'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
