import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  CheckCircle2,
  XCircle,
  Settings,
  Shield,
  Layers,
  Sparkles,
  TrendingUp,
  Ticket,
  Share2,
  Table,
  Check,
  ChevronRight,
} from 'lucide-react';

interface CustomModule {
  id: string;
  kod: string;
  nazwa: string;
  opis: string;
  kategoria: 'Obsługa Klienta' | 'Analityka & Prognozy' | 'Integracje' | 'Własne Obiekty';
  aktywny: boolean;
  dostepneRole: string[];
  polaLiczba: number;
}

export const CustomModulesManager: React.FC = () => {
  const [modules, setModules] = useState<CustomModule[]>([
    {
      id: 'mod-1',
      kod: 'ticketing',
      nazwa: 'Ticketing (Helpdesk & Reklamacje)',
      opis: 'Dedykowana kolekcja ticketów powiązana z firmami i kontaktami, z obsługą SLA i priorytetów.',
      kategoria: 'Obsługa Klienta',
      aktywny: true,
      dostepneRole: ['Super Admin', 'Support Lead', 'Vertriebsleitung'],
      polaLiczba: 8,
    },
    {
      id: 'mod-2',
      kod: 'forecasting',
      nazwa: 'Sales Forecasting & Predictive Analytics',
      opis: 'Zaawansowane prognozy kwartalne ważone prawdopodobieństwem i estymacjami domknięć szans sprzedaży.',
      kategoria: 'Analityka & Prognozy',
      aktywny: true,
      dostepneRole: ['Super Admin', 'Vertriebsleitung', 'Controlling'],
      polaLiczba: 6,
    },
    {
      id: 'mod-3',
      kod: 'integrations_zapier_slack',
      nazwa: 'Integracje Ekosystemu (Slack / MS Teams / Zapier)',
      opis: 'Dwukierunkowa wymiana informacji, alerty o wygranych dealach na kanałach Slack i webhooki Zapier.',
      kategoria: 'Integracje',
      aktywny: false,
      dostepneRole: ['Super Admin'],
      polaLiczba: 4,
    },
  ]);

  const [activeTab, setActiveTab] = useState<'modules' | 'field_configurator'>('modules');
  const [targetCollection, setTargetCollection] = useState('deale');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldTitle, setNewFieldTitle] = useState('');
  const [newFieldType, setNewFieldType] = useState('string');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [addedFieldsLog, setAddedFieldsLog] = useState<string[]>([
    'Pole "custom_nps_score" (integer) dodane do [firmy]',
    'Pole "custom_contract_expiry" (date) dodane do [deale]',
  ]);

  const toggleModule = (id: string) => {
    setModules(
      modules.map((m) => (m.id === id ? { ...m, aktywny: !m.aktywny } : m))
    );
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName || !newFieldTitle) return;

    const logEntry = `Pole "${newFieldName}" [${newFieldTitle}] (${newFieldType}${
      newFieldRequired ? ', Wymagane' : ''
    }) zostało pomyślnie wstrzyknięte do [${targetCollection}] bez restartu NocoBase!`;

    setAddedFieldsLog([logEntry, ...addedFieldsLog]);
    setNewFieldName('');
    setNewFieldTitle('');
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-6 rounded-xl border border-slate-800 shadow-2xl max-w-6xl mx-auto space-y-6">
      {/* Nagłówek */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold tracking-wide">
              Kundenspezifische Module & Dynamic Schema (Phase 4)
            </h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Zarządzaj modułami specyficznymi dla klienta, twórz nowe tabele i dodawaj pola niestandardowe w locie (Zero-Downtime Schema Evolution).
          </p>
        </div>

        {/* Zakładki */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'modules'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Katalog Modułów</span>
          </button>
          <button
            onClick={() => setActiveTab('field_configurator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'field_configurator'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Konfigurator Pól (Custom Fields)</span>
          </button>
        </div>
      </div>

      {activeTab === 'modules' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {modules.map((mod) => {
            const getIcon = () => {
              if (mod.kod === 'ticketing') return <Ticket className="w-5 h-5 text-sky-400" />;
              if (mod.kod === 'forecasting') return <TrendingUp className="w-5 h-5 text-emerald-400" />;
              return <Share2 className="w-5 h-5 text-purple-400" />;
            };

            return (
              <div
                key={mod.id}
                className={`bg-slate-800/60 p-5 rounded-xl border transition-all flex flex-col justify-between ${
                  mod.aktywny
                    ? 'border-amber-500/50 shadow-lg shadow-amber-500/5'
                    : 'border-slate-800 opacity-70'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getIcon()}
                    </div>
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                        mod.aktywny
                          ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {mod.aktywny ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Włączony
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Wyłączony
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-white">{mod.nazwa}</h3>
                    <span className="text-xs text-amber-400/90 font-mono block mt-0.5">
                      kod: {mod.kod}
                    </span>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {mod.opis}
                    </p>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Uprawnione Role (RBAC):</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {mod.dostepneRole.map((r, i) => (
                      <span
                        key={i}
                        className="bg-slate-900 text-slate-300 border border-slate-700 text-[11px] px-2 py-0.5 rounded"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Konfigurator Pól Niestandardowych */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-slate-800/40 p-5 rounded-xl border border-slate-700/60">
            <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Wstrzyknij Nowe Pole do Kolekcji
            </h3>
            <form onSubmit={handleAddField} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Kolekcja Docelowa
                </label>
                <select
                  value={targetCollection}
                  onChange={(e) => setTargetCollection(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="deale">deale (Szanse Sprzedaży)</option>
                  <option value="firmy">firmy (Przedsiębiorstwa)</option>
                  <option value="kontakty">kontakty</option>
                  <option value="tickets">tickets (Zgłoszenia Wsparcia)</option>
                  <option value="prognozy_sprzedazy">prognozy_sprzedazy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Nazwa Techniczna (np. custom_nip)
                  </label>
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="custom_nip"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Etykieta UI (np. Numer NIP)
                  </label>
                  <input
                    type="text"
                    value={newFieldTitle}
                    onChange={(e) => setNewFieldTitle(e.target.value)}
                    placeholder="Numer NIP"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Typ Danych
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="string">Tekst Krótki (String)</option>
                    <option value="text">Długi Tekst (Text / Markdown)</option>
                    <option value="integer">Liczba Całkowita (Integer)</option>
                    <option value="decimal">Kwota / Liczba Dziesiętna (Decimal)</option>
                    <option value="date">Data (Date)</option>
                    <option value="datetime">Data i Godzina (DateTime)</option>
                    <option value="select">Lista Wyboru (Select Dropdown)</option>
                    <option value="boolean">Przełącznik Tak/Nie (Boolean)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="req_cb"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <label htmlFor="req_cb" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Pole Wymagane (Not Null)
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-4 rounded-lg text-sm transition-all shadow-lg active:scale-98"
              >
                Dodaj Pole w Locie (Zero Deployment)
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Dziennik Zmian Schematu (Audit Trail)
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Wszystkie nowe kolumny są natychmiast rejestrowane w tabelach PostgreSQL 18 oraz udostępniane w widokach UI.
              </p>
              <div className="space-y-2 max-h-[220px] overflow-y-auto font-mono text-xs text-emerald-400">
                {addedFieldsLog.map((log, i) => (
                  <div key={i} className="bg-slate-900/80 p-2 rounded border border-slate-800 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Status Silnika: <strong className="text-emerald-400">Aktywny (Online)</strong></span>
              <span>Baza: PostgreSQL 18 RLS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
