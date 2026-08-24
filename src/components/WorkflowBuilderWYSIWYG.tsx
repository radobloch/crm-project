import React, { useState } from 'react';
import { Play, Plus, Trash2, Zap, Filter, CheckCircle2, ArrowRight, Bot, Mail, Send, CheckSquare } from 'lucide-react';

interface Condition {
  field: string;
  operator: string;
  value: any;
}

interface ActionItem {
  id: string;
  typ: 'UPDATE_FIELD' | 'CREATE_TASK' | 'SEND_EMAIL' | 'TRIGGER_WEBHOOK' | 'AI_ENRICHMENT';
  params: Record<string, any>;
}

export const WorkflowBuilderWYSIWYG: React.FC = () => {
  const [workflowName, setWorkflowName] = useState('Automatyczna Kwalifikacja & Follow-up Leadów');
  const [collection, setCollection] = useState('deale');
  const [triggerType, setTriggerType] = useState('ON_UPDATE');

  const [conditions, setConditions] = useState<Condition[]>([
    { field: 'wartosc', operator: 'gte', value: 10000 },
    { field: 'etap_id', operator: 'eq', value: 3 },
  ]);

  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: 'act-1',
      typ: 'UPDATE_FIELD',
      params: { target: 'deal', field: 'prawdopodobienstwo', value: 80 },
    },
    {
      id: 'act-2',
      typ: 'CREATE_TASK',
      params: { tytul: 'Skontaktuj się z decydentem po przesłaniu oferty', priorytet: 'Wysoki', dni: 2 },
    },
    {
      id: 'act-3',
      typ: 'AI_ENRICHMENT',
      params: { prompt: 'Wygeneruj analizę ryzyka i rekomendację rabatową dla klienta' },
    },
  ]);

  const [simulationData, setSimulationData] = useState(
    JSON.stringify({ id: 101, nazwa: 'Wdrożenie ERP - Pro Sp. z o.o.', wartosc: 15000, etap_id: 3, owner_id: 2 }, null, 2)
  );

  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);

  const addCondition = () => {
    setConditions([...conditions, { field: 'wartosc', operator: 'gte', value: 5000 }]);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const addAction = (typ: ActionItem['typ']) => {
    setActions([
      ...actions,
      {
        id: `act-${Date.now()}`,
        typ,
        params: typ === 'SEND_EMAIL' ? { temat: 'Powiadomienie o nowym etapie' } : { field: 'status', value: 'Aktywny' },
      },
    ]);
  };

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  const runSimulation = () => {
    setSimulating(true);
    setSimulationLogs([]);

    try {
      const parsedRecord = JSON.parse(simulationData);
      const logs: string[] = [];
      logs.push(`[${new Date().toLocaleTimeString()}] ▶️ Rozpoczęcie symulacji dla obiektu [${collection}] ID #${parsedRecord.id}...`);

      // Weryfikacja warunków
      let allPassed = true;
      for (const cond of conditions) {
        const val = parsedRecord[cond.field];
        let passed = false;
        if (cond.operator === 'gte') passed = Number(val) >= Number(cond.value);
        if (cond.operator === 'eq') passed = val === cond.value;
        if (cond.operator === 'gt') passed = Number(val) > Number(cond.value);

        logs.push(`🔍 Sprawdzanie warunku: ${cond.field} (${val}) ${cond.operator} ${cond.value} -> ${passed ? '✅ SPEŁNIONY' : '❌ NIESPEŁNIONY'}`);
        if (!passed) allPassed = false;
      }

      if (allPassed) {
        logs.push(`🎉 Wszystkie warunki spełnione! Uruchamianie ${actions.length} akcji:`);
        actions.forEach((act, idx) => {
          if (act.typ === 'UPDATE_FIELD') {
            logs.push(`  [Akcja ${idx + 1}] ⚡ Aktualizacja pola "${act.params.field}" na wartość: "${act.params.value}"`);
          } else if (act.typ === 'CREATE_TASK') {
            logs.push(`  [Akcja ${idx + 1}] 📝 Utworzono zadanie "${act.params.tytul}" (Priorytet: ${act.params.priorytet}, termin +${act.params.dni} dni)`);
          } else if (act.typ === 'AI_ENRICHMENT') {
            logs.push(`  [Akcja ${idx + 1}] 🤖 AI Enrichment: Model wygenerował profil klienta ("Wysoki potencjał LTV")`);
          } else if (act.typ === 'SEND_EMAIL') {
            logs.push(`  [Akcja ${idx + 1}] 📧 Wysłano powiadomienie e-mail do opiekuna deala`);
          } else if (act.typ === 'TRIGGER_WEBHOOK') {
            logs.push(`  [Akcja ${idx + 1}] 🌐 Wywołano webhook REST API (200 OK)`);
          }
        });
        logs.push(`✨ Symulacja zakończona sukcesem 100%!`);
      } else {
        logs.push(`🛑 Workflow zatrzymany: Warunki nie zostały spełnione. Żadna akcja nie została wykonana.`);
      }

      setTimeout(() => {
        setSimulationLogs(logs);
        setSimulating(false);
      }, 400);
    } catch (e: any) {
      setSimulationLogs([`❌ Błąd JSON danych testowych: ${e.message}`]);
      setSimulating(false);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-2xl max-w-6xl mx-auto space-y-6">
      {/* Nagłówek */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold tracking-wide">Visual Workflow Builder & Simulator (Phase 3)</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">Konstruktor reguł automatyzacji Matchpoint CRM z symulatorem danych w czasie rzeczywistym.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runSimulation}
            disabled={simulating}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-lg active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            {simulating ? 'Symulowanie...' : 'Uruchom Symulator'}
          </button>
        </div>
      </div>

      {/* Nazwa i Kontekst */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700/60">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Nazwa Reguły</label>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Wyzwalacz (Trigger)</label>
          <select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
          >
            <option value="ON_UPDATE">Aktualizacja Rekordu (On Update)</option>
            <option value="ON_CREATE">Nowy Rekord (On Create)</option>
            <option value="SCHEDULED">Harmonogram / Brak Aktywności (Cron)</option>
            <option value="WEBHOOK">Webhook Zewnętrzny</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Kolekcja Docelowa</label>
          <select
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
          >
            <option value="deale">Deale (Szanse Sprzedaży)</option>
            <option value="kontakty">Kontakty</option>
            <option value="firmy">Firmy</option>
            <option value="aktywnosci">Aktywności</option>
          </select>
        </div>
      </div>

      {/* Wizualny Pipeline (Trigger -> Warunki -> Akcje) */}
      <div className="space-y-4">
        {/* KROK 1: Warunki */}
        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Filter className="w-4 h-4" />
              <span>Warunki Logiczne (Wszystkie muszą być spełnione)</span>
            </div>
            <button
              onClick={addCondition}
              className="text-xs flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-200 px-2.5 py-1 rounded"
            >
              <Plus className="w-3.5 h-3.5" /> Dodaj Warunek
            </button>
          </div>

          <div className="space-y-2">
            {conditions.map((cond, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <input
                  type="text"
                  value={cond.field}
                  onChange={(e) => {
                    const nc = [...conditions];
                    nc[idx].field = e.target.value;
                    setConditions(nc);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm w-1/3"
                  placeholder="Pole (np. wartosc)"
                />
                <select
                  value={cond.operator}
                  onChange={(e) => {
                    const nc = [...conditions];
                    nc[idx].operator = e.target.value;
                    setConditions(nc);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                >
                  <option value="eq">Równe (=)</option>
                  <option value="ne">Różne (!=)</option>
                  <option value="gte">Większe lub równe (&gt;=)</option>
                  <option value="gt">Większe (&gt;)</option>
                  <option value="lte">Mniejsze lub równe (&lt;=)</option>
                </select>
                <input
                  type="text"
                  value={cond.value}
                  onChange={(e) => {
                    const nc = [...conditions];
                    nc[idx].value = e.target.value;
                    setConditions(nc);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-sm flex-1"
                  placeholder="Wartość"
                />
                <button onClick={() => removeCondition(idx)} className="text-rose-400 hover:text-rose-300 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* KROK 2: Akcje */}
        <div className="bg-slate-800/40 p-4 rounded-lg border border-slate-700/60">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Sekwencja Akcji (Wykonywane kaskadowo)</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => addAction('UPDATE_FIELD')}
                className="text-xs flex items-center gap-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700 px-2 py-1 rounded"
              >
                + Zmień Pole
              </button>
              <button
                onClick={() => addAction('CREATE_TASK')}
                className="text-xs flex items-center gap-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700 px-2 py-1 rounded"
              >
                + Zadanie
              </button>
              <button
                onClick={() => addAction('SEND_EMAIL')}
                className="text-xs flex items-center gap-1 bg-violet-900/60 hover:bg-violet-800 text-violet-200 border border-violet-700 px-2 py-1 rounded"
              >
                + E-mail
              </button>
              <button
                onClick={() => addAction('AI_ENRICHMENT')}
                className="text-xs flex items-center gap-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700 px-2 py-1 rounded"
              >
                + AI Enrichment
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {actions.map((act, idx) => (
              <div key={act.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center gap-3 flex-1">
                  <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                    {idx + 1}
                  </span>
                  {act.typ === 'UPDATE_FIELD' && (
                    <div className="flex items-center gap-2 text-sm text-blue-300">
                      <Zap className="w-4 h-4" />
                      <span>Aktualizacja:</span>
                      <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-xs text-white">
                        {act.params.field} = {String(act.params.value)}
                      </span>
                    </div>
                  )}
                  {act.typ === 'CREATE_TASK' && (
                    <div className="flex items-center gap-2 text-sm text-amber-300">
                      <CheckSquare className="w-4 h-4" />
                      <span>Utworzenie Zadania:</span>
                      <span className="text-xs font-semibold text-white bg-slate-900 px-2 py-0.5 rounded">
                        "{act.params.tytul}" (+{act.params.dni} dni)
                      </span>
                    </div>
                  )}
                  {act.typ === 'AI_ENRICHMENT' && (
                    <div className="flex items-center gap-2 text-sm text-rose-300">
                      <Bot className="w-4 h-4" />
                      <span>Wzbogacenie AI:</span>
                      <span className="text-xs text-slate-300 italic truncate max-w-md">"{act.params.prompt}"</span>
                    </div>
                  )}
                  {act.typ === 'SEND_EMAIL' && (
                    <div className="flex items-center gap-2 text-sm text-violet-300">
                      <Mail className="w-4 h-4" />
                      <span>Wysyłka Maila:</span>
                      <span className="text-xs text-slate-300">"{act.params.temat}"</span>
                    </div>
                  )}
                </div>
                <button onClick={() => removeAction(act.id)} className="text-rose-400 hover:text-rose-300 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Symulator & Konsola Wykonania */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Dane Wejściowe Symulatora (JSON Rekordu)
          </label>
          <textarea
            value={simulationData}
            onChange={(e) => setSimulationData(e.target.value)}
            rows={8}
            className="w-full bg-slate-900 font-mono text-xs text-emerald-400 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Logi Wykonania Reguły (Execution Console)
          </label>
          <div className="flex-1 bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-y-auto space-y-1.5 border border-slate-800 max-h-[190px]">
            {simulationLogs.length === 0 ? (
              <span className="text-slate-500 italic">Kliknij "Uruchom Symulator", aby przetestować regułę na danych...</span>
            ) : (
              simulationLogs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
