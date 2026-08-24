import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  BookOpen,
  Terminal,
  Copy,
  Check,
  Layers,
  Database,
  Cpu,
  Workflow,
  Sparkles,
  Server,
} from 'lucide-react';

interface AboutNocoBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutNocoBaseModal: React.FC<AboutNocoBaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const dockerCommand = `docker run -d \\
  --name nocobase-app \\
  -p 13000:80 \\
  -v ./nocobase-data:/app/nocobase/storage \\
  -e APP_KEY=secret-token-key-2026 \\
  -e DB_DIALECT=sqlite \\
  nocobase/nocobase:latest`;

  const dockerComposeCode = `version: '3.7'

services:
  app:
    image: nocobase/nocobase:latest
    ports:
      - "13000:80"
    environment:
      - APP_KEY=custom-secure-key-998
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase
      - DB_USER=nocobase
      - DB_PASSWORD=nocobase
    volumes:
      - ./storage:/app/nocobase/storage
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=nocobase
      - POSTGRES_USER=nocobase
      - POSTGRES_PASSWORD=nocobase
    volumes:
      - ./db-data:/var/lib/postgresql/data`;

  const gitCloneCode = `git clone https://github.com/nocobase/nocobase.git
cd nocobase
yarn install
yarn nocobase install --lang=en-US
yarn dev`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#09090b] text-[#fafafa] rounded-xl shadow-2xl border border-[#27272a] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between bg-zinc-900 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              NB
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-zinc-100">
                  About NocoBase & GitHub Deployment
                </h3>
                <span className="bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                  Open Source
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Scalability, private cloud deployment, and architectural concepts
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300 leading-relaxed">
          {/* Overview */}
          <div className="p-4 bg-indigo-950/30 rounded-xl border border-indigo-800/40 space-y-2">
            <h4 className="font-bold text-indigo-300 text-sm flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>What is NocoBase?</span>
            </h4>
            <p className="text-zinc-300">
              <strong className="text-white">NocoBase</strong> is an open-source, private, extremely scalable no-code / low-code data management and application development platform. Unlike traditional SaaS tools, NocoBase is 100% self-hostable with complete data ownership, microkernel plugin extensibility, and separation of data models from UI presentation blocks.
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <a
                href="https://github.com/nocobase/nocobase"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                <span>GitHub: nocobase/nocobase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-zinc-600">•</span>
              <a
                href="https://docs.nocobase.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300 font-semibold underline"
              >
                <span>Official Documentation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* 4 Pillars of Architecture */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider">
              Core Architecture Highlights
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-900 rounded-lg border border-[#27272a] space-y-1">
                <div className="font-semibold text-zinc-100 flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>Data Modeling First</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Data structure is completely decoupled from UI blocks. Tables, fields, associations (1:1, 1:N, N:N) operate natively on relational databases (PostgreSQL, MySQL, SQLite).
                </p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-lg border border-[#27272a] space-y-1">
                <div className="font-semibold text-zinc-100 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>WYSIWYG Block System</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Pages consist of customizable blocks (Table, Form, Kanban, Calendar, Details, Metrics) configurable in visual Design Mode.
                </p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-lg border border-[#27272a] space-y-1">
                <div className="font-semibold text-zinc-100 flex items-center space-x-1.5">
                  <Workflow className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Flow Automation Engine</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Event-driven workflow triggers, branch conditions, scheduled crons, and action nodes to orchestrate business processes.
                </p>
              </div>

              <div className="p-3 bg-zinc-900 rounded-lg border border-[#27272a] space-y-1">
                <div className="font-semibold text-zinc-100 flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-purple-400" />
                  <span>Microkernel Plugins</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Everything in NocoBase is a plugin (Auth, RBAC, File storage, SMS, API exporter, Workflow nodes).
                </p>
              </div>
            </div>
          </div>

          {/* Self-Hosting Instructions */}
          <div className="space-y-4 pt-2 border-t border-[#27272a]">
            <h4 className="font-bold text-zinc-200 text-xs uppercase tracking-wider">
              How to Deploy & Run NocoBase Locally or On Your Server
            </h4>

            {/* Option 1: Docker CLI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Option 1: Quick Start with Docker (Single Container)</span>
                <button
                  onClick={() => copyCode(dockerCommand, 1)}
                  className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] flex items-center space-x-1"
                >
                  {copiedIndex === 1 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 1 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-zinc-950 text-zinc-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-[#27272a]">
                {dockerCommand}
              </pre>
            </div>

            {/* Option 2: Docker Compose with PostgreSQL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Option 2: Production Setup with Docker Compose & PostgreSQL</span>
                <button
                  onClick={() => copyCode(dockerComposeCode, 2)}
                  className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] flex items-center space-x-1"
                >
                  {copiedIndex === 2 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 2 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-zinc-950 text-zinc-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-48 border border-[#27272a]">
                {dockerComposeCode}
              </pre>
            </div>

            {/* Option 3: Git clone & Node CLI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Option 3: Development from GitHub Source Repository</span>
                <button
                  onClick={() => copyCode(gitCloneCode, 3)}
                  className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] flex items-center space-x-1"
                >
                  {copiedIndex === 3 ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 3 ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="bg-zinc-950 text-zinc-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-[#27272a]">
                {gitCloneCode}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#27272a] bg-zinc-900 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
