import React, { useState } from 'react';
import {
  Workflow as WorkflowIcon,
  Play,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowDown,
  Sparkles,
  Send,
  Zap,
  Clock,
  Settings,
  Database,
  Filter,
  Check,
  RotateCcw,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { Workflow, Collection, WorkflowExecutionLog } from '../types';
import { WorkflowBuilderWYSIWYG } from './WorkflowBuilderWYSIWYG';

interface WorkflowBuilderProps {
  workflows: Workflow[];
  collections: Collection[];
  onToggleWorkflow: (id: string) => void;
  onAddWorkflow: (wf: Workflow) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflows,
  collections,
  onToggleWorkflow,
  onAddWorkflow,
}) => {
  const [activeMode, setActiveMode] = useState<'visual' | 'wysiwyg_designer'>('wysiwyg_designer');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || '');
  const [executionLogs, setExecutionLogs] = useState<WorkflowExecutionLog[]>([
    {
      id: 'log-1',
      workflowId: 'wf-1',
      workflowName: 'High-Value Deal Win Automation',
      status: 'success',
      timestamp: '2026-08-24T03:45:12Z',
      durationMs: 340,
      details: 'Evaluated deal deal-103 (Value: $65,000 > $20,000 threshold). Generated AI brief & sent Slack webhook.',
    },
    {
      id: 'log-2',
      workflowId: 'wf-2',
      workflowName: 'Low Stock Auto-Reorder Alert',
      status: 'success',
      timestamp: '2026-08-23T18:12:00Z',
      durationMs: 180,
      details: 'Product prod-303 stock (8) is <= reorder threshold (15). Created priority restocking task.',
    },
  ]);

  const [isSimulating, setIsSimulating] = useState(false);
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  const currentWorkflow = workflows.find((w) => w.id === selectedWorkflowId) || workflows[0];

  const handleTestRun = () => {
    if (!currentWorkflow) return;
    setIsSimulating(true);
    setTestResultMsg(null);

    setTimeout(() => {
      setIsSimulating(false);
      const newLog: WorkflowExecutionLog = {
        id: `log_${Date.now()}`,
        workflowId: currentWorkflow.id,
        workflowName: currentWorkflow.name,
        status: 'success',
        timestamp: new Date().toISOString(),
        durationMs: Math.floor(Math.random() * 250) + 120,
        details: `Simulated trigger for collection "${currentWorkflow.triggerCollectionId}". Passed all ${currentWorkflow.nodes.length} nodes successfully with zero errors.`,
      };
      setExecutionLogs((prev) => [newLog, ...prev]);
      setTestResultMsg(`Executed ${currentWorkflow.nodes.length} workflow nodes in ${newLog.durationMs}ms with status: SUCCESS.`);
    }, 900);
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'condition':
        return <Filter className="w-4 h-4 text-blue-500" />;
      case 'action_ai':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'action_webhook':
        return <Send className="w-4 h-4 text-emerald-500" />;
      case 'action_create':
        return <Database className="w-4 h-4 text-indigo-500" />;
      default:
        return <Settings className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Top Workflow Header */}
      <div className="bg-zinc-900 border-b border-[#27272a] p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <WorkflowIcon className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-zinc-100">
              NocoBase Workflow & Automation Engine
            </h2>
            <span className="bg-amber-950/80 border border-amber-800/50 text-amber-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
              Event-Driven Pipeline
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure triggers, condition branches, AI enrichments, webhooks, and multi-collection database sync
          </p>
        </div>

        {/* Mode Switcher & Action button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-[#27272a]">
            <button
              onClick={() => setActiveMode('wysiwyg_designer')}
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                activeMode === 'wysiwyg_designer'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>WYSIWYG Builder & Simulator</span>
            </button>
            <button
              onClick={() => setActiveMode('visual')}
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                activeMode === 'visual'
                  ? 'bg-zinc-800 text-white font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pipeline View</span>
            </button>
          </div>

          {activeMode === 'visual' && currentWorkflow && (
            <button
              onClick={handleTestRun}
              disabled={isSimulating}
              className="flex items-center space-x-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-800 disabled:text-zinc-600 text-white px-3.5 py-1.5 rounded-lg font-semibold shadow-2xs transition-colors"
            >
              {isSimulating ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isSimulating ? 'Simulating Run...' : 'Test Run Workflow'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Switch between WYSIWYG and Classic Pipeline View */}
      {activeMode === 'wysiwyg_designer' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-950">
          <WorkflowBuilderWYSIWYG />
        </div>
      ) : (
        /* Main Builder Grid */
        <div className="flex-1 flex overflow-hidden">
        {/* Left: Workflow Selection List */}
        <div className="w-72 bg-zinc-900/60 border-r border-[#27272a] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Automated Flows ({workflows.length})
            </div>

            <div className="space-y-1.5">
              {workflows.map((wf) => {
                const isSelected = selectedWorkflowId === wf.id;
                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWorkflowId(wf.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500/50 shadow-xs'
                        : 'bg-zinc-900 border-[#27272a] hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold truncate ${isSelected ? 'text-amber-200' : 'text-zinc-200'}`}>{wf.name}</h4>
                      <input
                        type="checkbox"
                        checked={wf.enabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggleWorkflow(wf.id);
                        }}
                        className="rounded text-amber-500 bg-zinc-950 border-[#27272a] focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                        title="Enable/Disable Workflow"
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                      {wf.description}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                      <span>{wf.nodes.length} nodes</span>
                      <span>Run {wf.executionCount} times</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Visual Node Flow Canvas */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col items-center">
          {testResultMsg && (
            <div className="w-full max-w-xl mb-4 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{testResultMsg}</span>
            </div>
          )}

          {currentWorkflow ? (
            <div className="w-full max-w-xl flex flex-col items-center space-y-4">
              {currentWorkflow.nodes.map((node, index) => {
                return (
                  <div key={node.id} className="w-full flex flex-col items-center">
                    {/* Node Box */}
                    <div className="w-full bg-zinc-900 p-4 rounded-xl border border-[#27272a] shadow-2xs hover:border-zinc-600 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-[#27272a] flex items-center justify-center">
                            {getNodeIcon(node.type)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
                              Step {index + 1} • {node.type.replace('_', ' ')}
                            </span>
                            <h4 className="text-xs font-bold text-zinc-100">{node.title}</h4>
                          </div>
                        </div>

                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>

                      {node.description && (
                        <p className="text-xs text-zinc-400 mt-2 bg-zinc-950/60 p-2 rounded-lg border border-[#27272a]">
                          {node.description}
                        </p>
                      )}
                    </div>

                    {/* Connecting Arrow */}
                    {index < currentWorkflow.nodes.length - 1 && (
                      <div className="my-1 flex flex-col items-center text-zinc-600">
                        <div className="h-4 w-0.5 bg-zinc-700" />
                        <ArrowDown className="w-4 h-4 text-zinc-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">Select a workflow to edit</div>
          )}
        </div>

        {/* Right: Live Execution Logs Drawer */}
        <div className="w-80 bg-zinc-900/60 border-l border-[#27272a] p-4 flex flex-col shrink-0">
          <div className="flex items-center justify-between pb-3 border-b border-[#27272a] mb-3">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-zinc-400" />
              <h4 className="text-xs font-bold text-zinc-200">Execution Logs</h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{executionLogs.length} events</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {executionLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-zinc-900 border border-[#27272a] text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200 text-[11px] truncate max-w-[170px]">
                    {log.workflowName}
                  </span>
                  <span className="text-[9px] bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 font-bold px-1.5 py-0.2 rounded">
                    {log.durationMs}ms
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">{log.details}</p>
                <div className="text-[10px] font-mono text-zinc-500 pt-1">
                  {log.timestamp.slice(11, 19)} UTC
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
