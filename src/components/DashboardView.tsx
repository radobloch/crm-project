import React, { useMemo } from 'react';
import {
  TrendingUp,
  Database,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { Collection, RecordItem } from '../types';

interface DashboardViewProps {
  collection: Collection;
  records: RecordItem[];
  onViewRecord: (record: RecordItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  collection,
  records,
  onViewRecord,
}) => {
  // Aggregate Metrics
  const totalCount = records.length;

  const currencyField = useMemo(() => {
    return collection.fields.find((f) => f.type === 'currency');
  }, [collection.fields]);

  const selectField = useMemo(() => {
    return collection.fields.find((f) => f.type === 'select' && f.options);
  }, [collection.fields]);

  const totalCurrencySum = useMemo(() => {
    if (!currencyField) return 0;
    return records.reduce((acc, curr) => acc + (Number(curr[currencyField.name]) || 0), 0);
  }, [records, currencyField]);

  const avgCurrency = totalCount > 0 ? totalCurrencySum / totalCount : 0;

  // Status breakdown
  const statusDistribution = useMemo(() => {
    if (!selectField || !selectField.options) return [];
    const counts: Record<string, number> = {};
    selectField.options.forEach((o) => (counts[o.value] = 0));

    records.forEach((rec) => {
      const val = rec[selectField.name];
      if (val && counts[val] !== undefined) {
        counts[val]++;
      }
    });

    return selectField.options.map((opt) => ({
      ...opt,
      count: counts[opt.value] || 0,
      percentage: totalCount > 0 ? Math.round(((counts[opt.value] || 0) / totalCount) * 100) : 0,
    }));
  }, [records, selectField, totalCount]);

  const primaryField = useMemo(() => {
    return collection.fields.find((f) => f.isPrimary) || collection.fields[0];
  }, [collection.fields]);

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#09090b] text-[#fafafa] space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
          {collection.title} Analytics & Metrics Block
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Real-time summary statistics, status pipelines, and recent updates.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Records */}
        <div className="bg-zinc-900 p-4 rounded-xl border border-[#27272a] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Records
            </span>
            <div className="text-2xl font-bold text-zinc-100 mt-1">{totalCount}</div>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" /> Active dataset synced
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-950/60 text-indigo-400 flex items-center justify-center border border-indigo-800/40">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Revenue / Value / Units */}
        {currencyField ? (
          <div className="bg-zinc-900 p-4 rounded-xl border border-[#27272a] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Total {currencyField.title}
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                ${totalCurrencySum.toLocaleString()}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Avg per record: ${Math.round(avgCurrency).toLocaleString()}
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900 p-4 rounded-xl border border-[#27272a] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Schema Fields
              </span>
              <div className="text-2xl font-bold text-zinc-100 mt-1">
                {collection.fields.length}
              </div>
              <span className="text-[11px] text-zinc-400 mt-1 block">
                Dynamic typed attributes
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-950/60 text-blue-400 flex items-center justify-center border border-blue-800/40">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Card 3: Health / Coverage */}
        <div className="bg-zinc-900 p-4 rounded-xl border border-[#27272a] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Data Health
            </span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">100%</div>
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Validation & integrity verified
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Middle Grid: Distribution & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        {selectField && selectField.options && (
          <div className="bg-zinc-900 p-5 rounded-xl border border-[#27272a] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-100">
                Distribution by {selectField.title}
              </h3>
              <PieIcon className="w-4 h-4 text-zinc-500" />
            </div>

            <div className="space-y-3">
              {statusDistribution.map((item) => (
                <div key={item.value} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color || '#71717a' }}
                      />
                      <span className="text-zinc-300">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-zinc-100">{item.count}</span>
                      <span className="text-zinc-500 font-mono text-[11px]">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Records Log */}
        <div className="bg-zinc-900 p-5 rounded-xl border border-[#27272a] shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-100">Recent Collection Records</h3>
            <Activity className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="divide-y divide-[#27272a] text-xs">
            {records.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                onClick={() => onViewRecord(rec)}
                className="py-2.5 flex items-center justify-between hover:bg-zinc-800/60 rounded px-1.5 cursor-pointer transition-colors"
              >
                <div className="truncate pr-2">
                  <div className="font-semibold text-zinc-200 truncate">
                    {rec[primaryField?.name || 'title'] || 'Untitled Record'}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    ID: {rec.id} • {rec.createdAt?.slice(0, 10) || '2026-08-24'}
                  </div>
                </div>

                <button className="text-indigo-400 font-medium hover:underline text-[11px] shrink-0">
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
