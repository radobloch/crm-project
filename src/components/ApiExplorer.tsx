import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Database,
  Send,
  Layers,
  Sparkles,
  Server,
  FileCode,
} from 'lucide-react';
import { Collection, RecordItem } from '../types';

interface ApiExplorerProps {
  collections: Collection[];
  recordsMap: Record<string, RecordItem[]>;
}

export const ApiExplorer: React.FC<ApiExplorerProps> = ({ collections, recordsMap }) => {
  const [selectedColId, setSelectedColId] = useState<string>(collections[0]?.id || '');
  const [selectedMethod, setSelectedMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'rest' | 'ddl'>('rest');

  const selectedCol = collections.find((c) => c.id === selectedColId) || collections[0];
  const colRecords = recordsMap[selectedCol?.id] || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate Sample JSON schema payload
  const samplePayload: Record<string, any> = {};
  selectedCol?.fields.forEach((f) => {
    if (f.defaultValue !== undefined) samplePayload[f.name] = f.defaultValue;
    else if (f.type === 'number' || f.type === 'currency') samplePayload[f.name] = 100;
    else if (f.type === 'boolean') samplePayload[f.name] = true;
    else if (f.type === 'tags') samplePayload[f.name] = ['tag1', 'tag2'];
    else samplePayload[f.name] = `Sample ${f.title}`;
  });

  const curlSnippet =
    selectedMethod === 'GET'
      ? `curl -X GET "https://api.nocobase.app/api/v1/${selectedCol?.name}?pageSize=10" \\\n  -H "Authorization: Bearer <YOUR_API_TOKEN>" \\\n  -H "Content-Type: application/json"`
      : selectedMethod === 'POST'
      ? `curl -X POST "https://api.nocobase.app/api/v1/${selectedCol?.name}" \\\n  -H "Authorization: Bearer <YOUR_API_TOKEN>" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(samplePayload, null, 2)}'`
      : `curl -X ${selectedMethod} "https://api.nocobase.app/api/v1/${selectedCol?.name}/:id" \\\n  -H "Authorization: Bearer <YOUR_API_TOKEN>" \\\n  -H "Content-Type: application/json"`;

  // SQL DDL Generator
  const generateSqlDdl = () => {
    if (!selectedCol) return '';
    const fieldLines = selectedCol.fields.map((f) => {
      let sqlType = 'VARCHAR(255)';
      if (f.type === 'longtext') sqlType = 'TEXT';
      if (f.type === 'number') sqlType = 'INTEGER';
      if (f.type === 'currency') sqlType = 'DECIMAL(12, 2)';
      if (f.type === 'percent') sqlType = 'NUMERIC(5, 2)';
      if (f.type === 'boolean') sqlType = 'BOOLEAN DEFAULT FALSE';
      if (f.type === 'date') sqlType = 'DATE';
      if (f.type === 'tags') sqlType = 'TEXT[]';

      const constraint = f.required ? 'NOT NULL' : '';
      return `    ${f.name.padEnd(18)} ${sqlType.padEnd(20)} ${constraint}`.trimEnd();
    });

    return `-- PostgreSQL / SQLite Schema Definition
CREATE TABLE IF NOT EXISTS ${selectedCol.name} (
    id                 VARCHAR(64) PRIMARY KEY,
${fieldLines.join(',\n')},
    created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_${selectedCol.name}_created ON ${selectedCol.name} (created_at DESC);
`;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-[#27272a] p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-zinc-100">
              NocoBase REST API & SQL Schema Hub
            </h2>
            <span className="bg-blue-950/80 border border-blue-800/50 text-blue-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
              OpenAPI 3.1 & DDL
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Auto-generated endpoints, live cURL requests, and relational database schema migrations
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-[#27272a]">
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'rest'
                ? 'bg-zinc-800 text-zinc-100 shadow-2xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            REST API Endpoints
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'ddl'
                ? 'bg-zinc-800 text-zinc-100 shadow-2xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            SQL DDL Schema
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Collections selector */}
        <div className="w-64 bg-zinc-900/60 border-r border-[#27272a] p-3 space-y-1 shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-2 mb-2">
            Select Collection
          </div>
          {collections.map((col) => {
            const isSelected = selectedCol?.id === col.id;
            return (
              <button
                key={col.id}
                onClick={() => setSelectedColId(col.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-950/40 text-blue-300 border border-blue-700/50 shadow-2xs'
                    : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <div className="truncate">
                  <div className={`font-semibold truncate ${isSelected ? 'text-blue-200' : 'text-zinc-200'}`}>{col.title}</div>
                  <div className="text-[10px] font-mono text-zinc-500">/{col.name}</div>
                </div>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono border border-[#27272a]">
                  {recordsMap[col.id]?.length || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: API / DDL Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {activeTab === 'rest' ? (
            <>
              {/* Method Switcher */}
              <div className="flex items-center space-x-2">
                {(['GET', 'POST', 'PUT', 'DELETE'] as const).map((m) => {
                  const isSelected = selectedMethod === m;
                  const colorClass =
                    m === 'GET'
                      ? isSelected
                        ? 'bg-emerald-600 text-white'
                        : 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 hover:bg-emerald-900/40'
                      : m === 'POST'
                      ? isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-400 bg-blue-950/40 border border-blue-800/40 hover:bg-blue-900/40'
                      : m === 'PUT'
                      ? isSelected
                        ? 'bg-amber-600 text-white'
                        : 'text-amber-400 bg-amber-950/40 border border-amber-800/40 hover:bg-amber-900/40'
                      : isSelected
                      ? 'bg-red-600 text-white'
                      : 'text-red-400 bg-red-950/40 border border-red-800/40 hover:bg-red-900/40';

                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMethod(m)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-colors ${colorClass}`}
                    >
                      {m}
                    </button>
                  );
                })}

                <div className="flex-1 bg-zinc-900 border border-[#27272a] rounded-md px-3 py-1.5 text-xs font-mono text-zinc-200 flex items-center justify-between">
                  <span>
                    https://api.nocobase.app/api/v1/{selectedCol?.name}
                    {selectedMethod !== 'GET' && selectedMethod !== 'POST' ? '/:id' : ''}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold">
                    Protected
                  </span>
                </div>
              </div>

              {/* cURL Snippet Box */}
              <div className="bg-zinc-950 rounded-xl p-4 text-zinc-100 space-y-2 shadow-sm font-mono text-xs border border-[#27272a]">
                <div className="flex items-center justify-between text-zinc-400 pb-2 border-b border-[#27272a] text-[11px] font-sans">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span>cURL Command Snippet</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(curlSnippet)}
                    className="flex items-center space-x-1 text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition-colors text-[10px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap text-blue-300 leading-relaxed pt-1">
                  {curlSnippet}
                </pre>
              </div>

              {/* Live JSON Response Preview */}
              <div className="bg-zinc-900 rounded-xl border border-[#27272a] p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-zinc-200">Response Payload Preview</span>
                    <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 border border-emerald-800/50 px-1.5 py-0.2 rounded font-bold">
                      200 OK
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">application/json</span>
                </div>

                <div className="bg-zinc-950 p-4 rounded-lg overflow-x-auto font-mono text-xs text-zinc-300 max-h-72 border border-[#27272a]">
                  <pre>
                    {JSON.stringify(
                      selectedMethod === 'GET'
                        ? {
                            status: 'success',
                            count: colRecords.length,
                            data: colRecords.slice(0, 3),
                            pagination: { page: 1, pageSize: 10, total: colRecords.length },
                          }
                        : {
                            status: 'success',
                            message: 'Record created successfully in database',
                            data: { id: `rec_${Date.now()}`, ...samplePayload },
                          },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            </>
          ) : (
            /* SQL DDL Generator View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">
                    PostgreSQL / MySQL Schema Script for `{selectedCol?.name}`
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Directly exportable SQL table definitions matching this collection's typed fields.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(generateSqlDdl())}
                  className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold shadow-2xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied SQL!' : 'Copy DDL Script'}</span>
                </button>
              </div>

              <div className="bg-zinc-950 p-5 rounded-xl text-zinc-200 font-mono text-xs overflow-x-auto leading-relaxed border border-[#27272a] shadow-md">
                <pre className="text-emerald-400">{generateSqlDdl()}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
