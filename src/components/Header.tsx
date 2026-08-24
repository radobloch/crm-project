import React from 'react';
import {
  Database,
  Plus,
  Search,
  Code2,
  Share2,
  Workflow as WorkflowIcon,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  Settings2,
} from 'lucide-react';
import { Collection } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCollection: Collection | null;
  designMode: boolean;
  setDesignMode: (val: boolean) => void;
  onNewRecord: () => void;
  onOpenSchemaModal: () => void;
  onOpenApiModal: () => void;
  onOpenAboutModal: () => void;
  onOpenImportExport: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  currentRole: string;
  setCurrentRole: (role: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCollection,
  designMode,
  setDesignMode,
  onNewRecord,
  onOpenSchemaModal,
  onOpenApiModal,
  onOpenAboutModal,
  onOpenImportExport,
  searchTerm,
  setSearchTerm,
  currentRole,
  setCurrentRole,
}) => {
  return (
    <header className="h-14 border-b border-[#27272a] bg-[#09090b] px-4 flex items-center justify-between sticky top-0 z-30 select-none text-[#fafafa]">
      {/* Left: Brand & Collection Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm tracking-wide">
            NB
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-zinc-100 text-sm tracking-tight">NocoBase</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v1.4 Open Platform
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 font-normal leading-none mt-0.5">
              Extensible No-Code Data & Workflow Architecture
            </p>
          </div>
        </div>

        <div className="h-4 w-px bg-[#27272a] mx-1" />

        {/* Collection / Section Indicator */}
        <div className="flex items-center space-x-2 text-xs">
          {activeTab === 'collection' && selectedCollection ? (
            <div className="flex items-center space-x-1.5 text-zinc-200 bg-zinc-900 px-2.5 py-1 rounded-md border border-[#27272a]">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-zinc-100">{selectedCollection.title}</span>
              <span className="text-zinc-500 text-[11px]">({selectedCollection.name})</span>
            </div>
          ) : activeTab === 'workflows' ? (
            <div className="flex items-center space-x-1.5 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
              <WorkflowIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">Visual Workflows & Triggers</span>
            </div>
          ) : activeTab === 'roles' ? (
            <div className="flex items-center space-x-1.5 text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">RBAC Roles & Permissions</span>
            </div>
          ) : activeTab === 'api' ? (
            <div className="flex items-center space-x-1.5 text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium">REST API & SQL Schema Hub</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Middle: Universal Search & Filter */}
      {activeTab === 'collection' && (
        <div className="hidden md:flex items-center relative w-72 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search records, titles, values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-900 hover:bg-zinc-800/80 focus:bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-md outline-none transition-all placeholder:text-zinc-500 text-zinc-200"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded px-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Right: Actions, Design Mode Switch, Role Switch, Info */}
      <div className="flex items-center space-x-2">
        {/* Role Simulator Switch */}
        <div className="flex items-center space-x-1.5 bg-zinc-900 p-1 rounded-md text-xs border border-[#27272a]">
          <span className="text-[11px] text-zinc-400 pl-1 font-medium hidden sm:inline">Role:</span>
          <select
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-0.5 font-medium outline-none cursor-pointer focus:ring-1 focus:ring-indigo-500"
          >
            <option value="admin">Root Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* Visual UI Block Designer Toggle (NocoBase Signature Feature) */}
        <button
          onClick={() => setDesignMode(!designMode)}
          className={`flex items-center space-x-1.5 text-xs px-2.5 py-1.5 rounded-md font-medium border transition-colors ${
            designMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-zinc-900 text-zinc-300 border-[#27272a] hover:bg-zinc-800 hover:text-white'
          }`}
          title="Toggle NocoBase Visual Block Design Mode (Configure columns, layout, and block settings)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">UI Block Designer</span>
          {designMode && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
        </button>

        {/* Primary Action: + Add Record */}
        {activeTab === 'collection' && (
          <button
            onClick={onNewRecord}
            className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        )}

        {/* GitHub / Repo Info Button */}
        <button
          onClick={onOpenAboutModal}
          className="flex items-center space-x-1 text-xs text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] px-2.5 py-1.5 rounded-md transition-colors"
          title="NocoBase GitHub Repo & Self-Hosting Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden lg:inline font-medium">About Repo</span>
        </button>

        {/* Schema / Collections Editor */}
        <button
          onClick={onOpenSchemaModal}
          className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors border border-transparent hover:border-[#27272a]"
          title="Open Data Model & Schema Designer"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
