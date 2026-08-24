import React from 'react';
import {
  Briefcase,
  CheckSquare,
  Package,
  Users,
  Database,
  Plus,
  Workflow,
  Shield,
  Code2,
  Table,
  Columns,
  Calendar,
  BarChart3,
  HelpCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Boxes,
} from 'lucide-react';
import { Collection, ViewType } from '../types';

interface SidebarProps {
  collections: Collection[];
  selectedCollectionId: string;
  onSelectCollection: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  viewType: ViewType;
  setViewType: (view: ViewType) => void;
  onOpenCreateCollection: () => void;
  onOpenImportExport: () => void;
  onOpenAboutModal: () => void;
}

const getCollectionIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Briefcase':
      return <Briefcase className="w-4 h-4 text-emerald-600" />;
    case 'CheckSquare':
      return <CheckSquare className="w-4 h-4 text-blue-600" />;
    case 'Package':
      return <Package className="w-4 h-4 text-amber-600" />;
    case 'Users':
      return <Users className="w-4 h-4 text-indigo-600" />;
    default:
      return <Database className="w-4 h-4 text-slate-600" />;
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  collections,
  selectedCollectionId,
  onSelectCollection,
  activeTab,
  setActiveTab,
  viewType,
  setViewType,
  onOpenCreateCollection,
  onOpenImportExport,
  onOpenAboutModal,
}) => {
  return (
    <aside className="w-64 border-r border-[#27272a] bg-[#09090b] flex flex-col h-[calc(100vh-3.5rem)] select-none shrink-0 text-zinc-300">
      {/* View Switcher (when a collection is active) */}
      {activeTab === 'collection' && (
        <div className="p-3 border-b border-[#27272a] bg-[#09090b]">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5 px-1">
            Display Block View
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 border border-[#27272a] rounded-lg">
            <button
              onClick={() => setViewType('table')}
              className={`flex flex-col items-center py-1.5 px-1 rounded text-[11px] font-medium transition-all ${
                viewType === 'table'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="Table Block View"
            >
              <Table className="w-3.5 h-3.5 mb-0.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewType('kanban')}
              className={`flex flex-col items-center py-1.5 px-1 rounded text-[11px] font-medium transition-all ${
                viewType === 'kanban'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="Kanban Board View"
            >
              <Columns className="w-3.5 h-3.5 mb-0.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewType('calendar')}
              className={`flex flex-col items-center py-1.5 px-1 rounded text-[11px] font-medium transition-all ${
                viewType === 'calendar'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="Calendar Timeline View"
            >
              <Calendar className="w-3.5 h-3.5 mb-0.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewType('dashboard')}
              className={`flex flex-col items-center py-1.5 px-1 rounded text-[11px] font-medium transition-all ${
                viewType === 'dashboard'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="Metric Analytics & Charts"
            >
              <BarChart3 className="w-3.5 h-3.5 mb-0.5" />
              <span>Metrics</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {/* Data Collections Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Data Collections
            </span>
            <button
              onClick={onOpenCreateCollection}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              title="Create New Data Collection (Table)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {collections.map((col) => {
              const isSelected = activeTab === 'collection' && selectedCollectionId === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => {
                    setActiveTab('collection');
                    onSelectCollection(col.id);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all group ${
                    isSelected
                      ? 'bg-zinc-800 text-white border border-zinc-700/60 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="shrink-0">{getCollectionIcon(col.icon)}</span>
                    <span className="truncate">{col.title}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected
                        ? 'bg-zinc-700 text-zinc-200'
                        : 'text-zinc-500 group-hover:text-zinc-400'
                    }`}
                  >
                    {col.fields.length}f
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Matchpoint CRM Special Module */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 px-2 mb-1.5 flex items-center justify-between">
            <span>Matchpoint Project</span>
            <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 px-1.5 py-0.2 rounded font-mono">
              PG 18
            </span>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveTab('matchpoint')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'matchpoint'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60 shadow-xs'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900/80 border border-transparent'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <div className="text-left truncate">
                <div className="truncate">PostgreSQL 18 & Hostinger</div>
                <div className="text-[10px] text-zinc-500 font-normal">12 Tabel, RLS & Triggery</div>
              </div>
            </button>
          </div>
        </div>

        {/* Platform Modules (NocoBase Architecture Core) */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-1.5">
            Platform Engine
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'workflows'
                  ? 'bg-zinc-800 text-amber-400 border border-zinc-700/60 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <Workflow className="w-4 h-4 text-amber-500" />
              <span>Workflows & Automations</span>
            </button>

            <button
              onClick={() => setActiveTab('custom_modules')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'custom_modules'
                  ? 'bg-zinc-800 text-sky-400 border border-zinc-700/60 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <Boxes className="w-4 h-4 text-sky-400" />
              <span>Custom Modules (Phase 4)</span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'roles'
                  ? 'bg-zinc-800 text-emerald-400 border border-zinc-700/60 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Roles & Permissions (RBAC)</span>
            </button>

            <button
              onClick={() => setActiveTab('api')}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'api'
                  ? 'bg-zinc-800 text-blue-400 border border-zinc-700/60 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <Code2 className="w-4 h-4 text-blue-500" />
              <span>REST API & DDL Schema</span>
            </button>
          </div>
        </div>

        {/* Tools & Utilities */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-1.5">
            Data Tools
          </div>
          <div className="space-y-0.5">
            <button
              onClick={onOpenImportExport}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-zinc-500" />
              <span>Import / Export (CSV, JSON)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info Box */}
      <div className="p-3 border-t border-[#27272a] bg-[#09090b]">
        <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-[#27272a] flex flex-col space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-300">NocoBase Architecture</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" title="Engine Live" />
          </div>
          <p className="text-[11px] text-zinc-500 leading-tight">
            Private, open-source, scalable data management platform.
          </p>
          <button
            onClick={onOpenAboutModal}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium text-left pt-0.5 flex items-center space-x-1"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Deployment & GitHub Guide</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
