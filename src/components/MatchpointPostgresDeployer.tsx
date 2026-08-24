import React, { useState } from 'react';
import {
  Database,
  Server,
  Shield,
  Search,
  FileCode,
  Download,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Table,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Play,
  Flame,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  MATCHPOINT_DOCKER_COMPOSE,
  MATCHPOINT_ENV_TEMPLATE,
  MATCHPOINT_INIT_SQL,
} from '../data/matchpointSqlData';

interface MatchpointPostgresDeployerProps {
  onLoadMatchpointCollections?: () => void;
}

export const MatchpointPostgresDeployer: React.FC<MatchpointPostgresDeployerProps> = ({
  onLoadMatchpointCollections,
}) => {
  const [activeTab, setActiveTab] = useState<
    'docker' | 'sql' | 'guide' | 'tables' | 'rls_trgm_sim'
  >('docker');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulation State
  const [searchSimQuery, setSearchSimQuery] = useState('tech');
  const [simRole, setSimRole] = useState<'admin' | 'manager' | 'handlowiec'>('handlowiec');
  const [auditEventLog, setAuditEventLog] = useState<any[]>([
    {
      id: 1,
      tabela: 'deale',
      akcja: 'UPDATE',
      zmienione_pola: ['wartosc', 'etap_id'],
      stare: { wartosc: 45000, etap: 'Kwalifikacja' },
      nowe: { wartosc: 62000, etap: 'Oferta i Negocjacje' },
      czas: '2026-08-24 11:42:01',
      uzytkownik: 'Jan Kowalski (Handlowiec)',
    },
    {
      id: 2,
      tabela: 'kontakty',
      akcja: 'INSERT',
      zmienione_pola: ['imie', 'nazwisko', 'email', 'firma_id'],
      stare: null,
      nowe: { imie: 'Marta', nazwisko: 'Zielińska', email: 'marta.z@techcorp.pl' },
      czas: '2026-08-24 11:38:15',
      uzytkownik: 'Anna Nowak (Manager)',
    },
  ]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadFile = (filename: string, content: string, type = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tablesList = [
    {
      name: 'kontakty',
      title: '1. Kontakty (Contacts)',
      cols: 'id, imie, nazwisko, email, telefon, stanowisko, firma_id, wlasciciel_id, zespol_id, zgoda_marketingowa, wlasciwosci_niestandardowe (JSONB)',
      relations: 'FK -> firmy(id), uzytkownicy(id), zespoly(id)',
      indexes: 'B-Tree (email, firma_id), GIN pg_trgm (imie+nazwisko, email)',
      rls: 'Własne rekordy lub odczyt w zespole / Admin pełny dostęp',
    },
    {
      name: 'firmy',
      title: '2. Firmy (Companies)',
      cols: 'id, nazwa, domena, nip, regon, branza, wielkosc_zatrudnienia, telefon, email, miasto, kraj, roczny_obrot, wlasciciel_id, zespol_id',
      relations: 'FK -> uzytkownicy(id), zespoly(id)',
      indexes: 'B-Tree (domena, nip), GIN pg_trgm (nazwa, domena)',
      rls: 'Przypisany opiekun handlowy / Zespół / Admin',
    },
    {
      name: 'deale',
      title: '3. Deale (Deals / Szanse)',
      cols: 'id, nazwa, wartosc, waluta, pipeline_id, etap_id, firma_id, kontakt_glowny_id, wlasciciel_id, zespol_id, status, priorytet, spodziewana_data_zamkniecia',
      relations: 'FK -> pipeline(id), etapy_stufen(id), firmy(id), kontakty(id)',
      indexes: 'B-Tree (pipeline_id, etap_id, status), GIN pg_trgm (nazwa)',
      rls: 'Handlowiec widzi swoje szanse, Manager widzi zespół, Admin wszystko',
    },
    {
      name: 'aktywnosci',
      title: '4. Aktywności (Activities)',
      cols: 'id, typ, tytul, opis, termin_od, termin_do, status, kontakt_id, firma_id, deal_id, wykonawca_id, zespol_id, stworzono_przez',
      relations: 'FK -> kontakty(id), firmy(id), deale(id), uzytkownicy(id)',
      indexes: 'B-Tree (termin_od, wykonawca_id, deal_id, kontakt_id)',
      rls: 'Wykonawca lub twórca zadania / Zespół',
    },
    {
      name: 'pipeline',
      title: '5. Pipeline (Lejki)',
      cols: 'id, nazwa, kod, opis, domyslny, aktywny, zespol_id',
      relations: 'FK -> zespoly(id)',
      indexes: 'B-Tree UNIQUE (kod)',
      rls: 'Odczyt powszechny, modyfikacja Admin/Manager',
    },
    {
      name: 'etapy_stufen',
      title: '6. Etapy Lejka (Stufen)',
      cols: 'id, pipeline_id, nazwa, kolejnosc, prawdopodobienstwo, kolor_hex, wymagane_pola',
      relations: 'FK -> pipeline(id) ON DELETE CASCADE',
      indexes: 'B-Tree (pipeline_id, kolejnosc)',
      rls: 'Definiowane centralnie w NocoBase',
    },
    {
      name: 'powiazania_verknuepfungen',
      title: '7. Powiązania M:N (Verknüpfungen)',
      cols: 'id, typ_zrodla, zrodlo_id, typ_celu, cel_id, rola_powiazania, opis, stworzono_przez',
      relations: 'Polimorficzne powiązania między dowolnymi rekordami CRM',
      indexes: 'UNIQUE (typ_zrodla, zrodlo_id, typ_celu, cel_id, rola_powiazania)',
      rls: 'Dostęp powiązany z prawami do encji nadrzędnych',
    },
    {
      name: 'wlasciwosci_eigenschaften',
      title: '8. Właściwości Niestandardowe (Eigenschaften)',
      cols: 'id, encja, klucz, etykieta, typ_danych, wymagane, domyslna_wartosc, opcje_wyboru (JSONB), aktywne',
      relations: 'Słownik metadanych dla dynamicznych pól w formularzach',
      indexes: 'UNIQUE (encja, klucz)',
      rls: 'Zarządzane przez administratorów systemu',
    },
    {
      name: 'uzytkownicy',
      title: '9. Użytkownicy (Nutzer)',
      cols: 'id, imie, nazwisko, email, haslo_hash, telefon, stanowisko, rola, zespol_id, avatar_url, aktywny',
      relations: 'FK -> zespoly(id)',
      indexes: 'B-Tree UNIQUE (email)',
      rls: 'Konta systemowe i profile użytkowników',
    },
    {
      name: 'zespoly',
      title: '10. Zespoły (Teams)',
      cols: 'id, nazwa, kod, opis, aktywny, stworzono_at, zaktualizowano_at',
      relations: 'Struktura organizacyjna dla jednostek biznesowych',
      indexes: 'B-Tree UNIQUE (nazwa, kod)',
      rls: 'Dzielenie lejków i rekordów według działów',
    },
    {
      name: 'widoki_ansichten',
      title: '11. Widoki i Filtry (Ansichten)',
      cols: 'id, uzytkownik_id, zespol_id, encja, nazwa, typ_widoku, konfiguracja_filtrow (JSONB), konfiguracja_kolumn (JSONB), jest_publiczny',
      relations: 'FK -> uzytkownicy(id), zespoly(id)',
      indexes: 'B-Tree (uzytkownik_id, encja)',
      rls: 'Widoki prywatne użytkownika lub udostępnione publicznie/zespołowo',
    },
    {
      name: 'audit_log',
      title: '12. Dziennik Audytu (Audit-Log)',
      cols: 'id (BIGSERIAL), nazwa_tabeli, rekord_id, akcja (INSERT/UPDATE/DELETE), stare_wartosci (JSONB), nowe_wartosci (JSONB), zmienione_pola, uzytkownik_id, czas_zdarzenia',
      relations: 'Zasilana automatycznie przez trigger fn_audit_log_trigger()',
      indexes: 'B-Tree (nazwa_tabeli, rekord_id), (czas_zdarzenia DESC)',
      rls: 'Tylko do odczytu dla audytorów / Super Admina (Niezmienna historia)',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Top Header */}
      <div className="bg-zinc-900 border-b border-[#27272a] px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-zinc-100">
                  Matchpoint CRM • PostgreSQL 18 & Hostinger VPS
                </h2>
                <span className="bg-emerald-950/80 border border-emerald-800/50 text-emerald-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                  12 Tabel + RLS + pg_trgm + Triggery
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gotowa architektura relacyjna pod NocoBase i wdrożenie na serwerze Hostinger VPS
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {onLoadMatchpointCollections && (
            <button
              onClick={onLoadMatchpointCollections}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-[#27272a] rounded-lg text-xs font-semibold transition-colors"
              title="Załaduj tabele Matchpoint CRM do interfejsu NocoBase"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Załaduj Tabele do UI NocoBase</span>
            </button>
          )}

          <button
            onClick={() =>
              downloadFile('init.sql', MATCHPOINT_INIT_SQL, 'text/sql')
            }
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pobierz init.sql</span>
          </button>

          <button
            onClick={() =>
              downloadFile('docker-compose.yml', MATCHPOINT_DOCKER_COMPOSE, 'text/yaml')
            }
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pobierz docker-compose.yml</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="px-6 border-b border-[#27272a] bg-zinc-950/60 flex items-center space-x-1 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveTab('docker')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'docker'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>1. Docker Compose (Hostinger VPS)</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'sql'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>2. Skrypt init.sql (12 Tabel + RLS + Triggery)</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'tables'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>3. Struktura 12 Tabel CRM</span>
        </button>

        <button
          onClick={() => setActiveTab('rls_trgm_sim')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'rls_trgm_sim'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>4. Symulator pg_trgm, RLS & Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'guide'
              ? 'border-emerald-500 text-emerald-400 bg-zinc-900/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>5. Instrukcja Krok po Kroku (Hostinger & NocoBase)</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: DOCKER COMPOSE */}
        {activeTab === 'docker' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Quick summary banner */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-emerald-200">
                  Gotowy stos Docker Compose: PostgreSQL 18 + NocoBase dla Hostinger VPS
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  Poniższy plik automatycznie uruchamia kontener z najnowszym silnikiem PostgreSQL 18
                  oraz NocoBase. Skrypt <code className="text-emerald-400 font-mono">init.sql</code> jest montowany
                  do <code className="text-emerald-400 font-mono">/docker-entrypoint-initdb.d/</code> i wykonuje się
                  automatycznie przy pierwszym starcie bazy!
                </p>
              </div>
            </div>

            {/* docker-compose.yml Card */}
            <div className="bg-zinc-900 border border-[#27272a] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-zinc-950/80 border-b border-[#27272a] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-zinc-300 font-bold">docker-compose.yml</span>
                  <span className="text-[10px] bg-blue-950/80 text-blue-300 border border-blue-800/40 px-1.5 py-0.2 rounded font-mono">
                    PostgreSQL 18 + NocoBase
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      copyToClipboard(MATCHPOINT_DOCKER_COMPOSE, 'docker_compose')
                    }
                    className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                  >
                    {copiedKey === 'docker_compose' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'docker_compose' ? 'Skopiowano!' : 'Kopiuj'}</span>
                  </button>
                  <button
                    onClick={() =>
                      downloadFile('docker-compose.yml', MATCHPOINT_DOCKER_COMPOSE, 'text/yaml')
                    }
                    className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pobierz</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-zinc-950 font-mono text-xs text-zinc-300 overflow-x-auto max-h-96 leading-relaxed">
                {MATCHPOINT_DOCKER_COMPOSE}
              </pre>
            </div>

            {/* .env Card */}
            <div className="bg-zinc-900 border border-[#27272a] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-zinc-950/80 border-b border-[#27272a] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs text-zinc-300 font-bold">.env</span>
                  <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/40 px-1.5 py-0.2 rounded font-mono">
                    Zmienne Środowiskowe
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(MATCHPOINT_ENV_TEMPLATE, 'env_file')}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                  >
                    {copiedKey === 'env_file' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'env_file' ? 'Skopiowano!' : 'Kopiuj'}</span>
                  </button>
                  <button
                    onClick={() => downloadFile('.env', MATCHPOINT_ENV_TEMPLATE)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pobierz</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-zinc-950 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                {MATCHPOINT_ENV_TEMPLATE}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: SKRYPT SQL (INIT.SQL) */}
        {activeTab === 'sql' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl flex items-start justify-between">
              <div className="space-y-1 text-xs">
                <h3 className="font-bold text-blue-200">
                  Kompletny skrypt inicjalizacyjny PostgreSQL 18 (init.sql)
                </h3>
                <p className="text-zinc-300 leading-relaxed">
                  Zawiera 12 relacyjnych tabel z polskimi nazwami kolumn, rozszerzenie <code className="text-blue-400 font-mono">pg_trgm</code> z indeksami GIN, automatyczne triggery dla tabeli <code className="text-blue-400 font-mono">audit_log</code> oraz reguły <code className="text-blue-400 font-mono">Row Level Security (RLS)</code>.
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => copyToClipboard(MATCHPOINT_INIT_SQL, 'full_init_sql')}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  {copiedKey === 'full_init_sql' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'full_init_sql' ? 'Skopiowano!' : 'Kopiuj SQL'}</span>
                </button>
                <button
                  onClick={() =>
                    downloadFile('init.sql', MATCHPOINT_INIT_SQL, 'text/sql')
                  }
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pobierz init.sql</span>
                </button>
              </div>
            </div>

            {/* Code Box */}
            <div className="bg-zinc-900 border border-[#27272a] rounded-xl overflow-hidden shadow-2xs">
              <div className="px-4 py-3 bg-zinc-950/80 border-b border-[#27272a] flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-300 font-bold">
                  init.sql • (12 Tabel, RLS, pg_trgm, Triggery)
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  ~350 linii SQL DDL & PL/pgSQL
                </span>
              </div>
              <pre className="p-4 bg-zinc-950 font-mono text-xs text-zinc-200 overflow-x-auto max-h-[600px] leading-relaxed">
                {MATCHPOINT_INIT_SQL}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: 12 TABEL CRM */}
        {activeTab === 'tables' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-100">
                  Architektura 12 Tabel Matchpoint CRM
                </h3>
                <p className="text-xs text-zinc-400">
                  Każda tabela posiada dedykowane relacje kluczy obcych (FK), indeksy B-Tree/GIN oraz polityki bezpieczeństwa.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tablesList.map((tbl, i) => (
                <div
                  key={tbl.name}
                  className="p-4 bg-zinc-900 border border-[#27272a] rounded-xl space-y-2 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-zinc-100 flex items-center space-x-1.5">
                      <Table className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{tbl.title}</span>
                    </h4>
                    <span className="text-[10px] font-mono bg-zinc-950 text-zinc-400 px-1.5 py-0.2 rounded border border-[#27272a]">
                      {tbl.name}
                    </span>
                  </div>

                  <div className="text-[11px] text-zinc-300 space-y-1 pt-1">
                    <p>
                      <strong className="text-zinc-400 font-normal">Kolumny: </strong>
                      <span className="font-mono text-zinc-300">{tbl.cols}</span>
                    </p>
                    <p>
                      <strong className="text-zinc-400 font-normal">Relacje (FK): </strong>
                      <span className="text-blue-400 font-mono">{tbl.relations}</span>
                    </p>
                    <p>
                      <strong className="text-zinc-400 font-normal">Indeksy: </strong>
                      <span className="text-amber-300 font-mono">{tbl.indexes}</span>
                    </p>
                    <p>
                      <strong className="text-zinc-400 font-normal">RLS Polityka: </strong>
                      <span className="text-emerald-400">{tbl.rls}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYMULATOR RLS, PG_TRGM & AUDIT LOG */}
        {activeTab === 'rls_trgm_sim' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Feature 1: pg_trgm Trigram Search Simulator */}
            <div className="p-5 bg-zinc-900 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-zinc-100">
                    1. Pełnotekstowe Wyszukiwanie Rozmyte: pg_trgm (Trigram GIN)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/80 border border-blue-800/40 px-2 py-0.5 rounded font-bold">
                  GIN (nazwa gin_trgm_ops)
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Dzięki rozszerzeniu <code className="text-blue-400 font-mono">pg_trgm</code> i indeksom GIN, zapytania takie jak <code className="text-zinc-200 font-mono">WHERE nazwa ILIKE '%tech%'</code> lub z funkcją <code className="text-zinc-200 font-mono">similarity(nazwa, 'tech') &gt; 0.3</code> wykonują się w milisekundach nawet na milionach rekordów firm i kontaktów.
              </p>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={searchSimQuery}
                  onChange={(e) => setSearchSimQuery(e.target.value)}
                  placeholder="Wpisz frazę (np. tech, kowals, software)..."
                  className="flex-1 px-3 py-1.5 bg-zinc-950 border border-[#27272a] rounded-lg text-xs text-zinc-200 outline-none focus:border-blue-500"
                />
                <div className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-[#27272a]">
                  EXPLAIN ANALYZE: <span className="text-emerald-400">Bitmap Index Scan on idx_firmy_trgm_nazwa (0.42ms)</span>
                </div>
              </div>
            </div>

            {/* Feature 2: Row Level Security (RLS) Simulator */}
            <div className="p-5 bg-zinc-900 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-zinc-100">
                    2. Row Level Security (RLS) - Symulator Uprawnień w PostgreSQL
                  </h4>
                </div>
                <div className="flex items-center space-x-1 bg-zinc-950 p-1 rounded-lg border border-[#27272a]">
                  {(['admin', 'manager', 'handlowiec'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSimRole(r)}
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded capitalize transition-colors ${
                        simRole === r
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-lg border border-[#27272a] text-xs font-mono space-y-2">
                <div className="text-zinc-400">
                  -- Aktywna sesja: <span className="text-emerald-400">SET app.current_user_role = '{simRole}';</span>
                </div>
                <div className="text-zinc-300">
                  {simRole === 'admin' && (
                    <span className="text-emerald-300">
                      ✓ Administrator: Dostęp do WSZYSTKICH 12 tabel, firm, kontaktów i lejków (Bypass RLS p_deale_select).
                    </span>
                  )}
                  {simRole === 'manager' && (
                    <span className="text-amber-300">
                      ✓ Manager: Widzi wszystkie rekordy należące do jego Zespołu (zespol_id = app.current_team_id).
                    </span>
                  )}
                  {simRole === 'handlowiec' && (
                    <span className="text-blue-300">
                      ✓ Handlowiec: Widzi i edytuje wyłącznie własne deale i kontakty (wlasciciel_id = app.current_user_id) + wspólne firmy w zespole.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Feature 3: Automatic Audit Trigger Log */}
            <div className="p-5 bg-zinc-900 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-zinc-100">
                    3. Automatyczny Trigger Audytowy (fn_audit_log_trigger)
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-800/40 px-2 py-0.5 rounded">
                  AFTER INSERT/UPDATE/DELETE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Trigger automatycznie wychwytuje każdą zmianę w tabelach <code className="font-mono text-zinc-200">kontakty</code>, <code className="font-mono text-zinc-200">firmy</code>, <code className="font-mono text-zinc-200">deale</code> i rejestruje stan przed/po w JSONB w tabeli <code className="font-mono text-zinc-200">audit_log</code>.
              </p>

              <div className="space-y-2">
                {auditEventLog.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-zinc-950 rounded-lg border border-[#27272a] text-xs font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            ev.akcja === 'INSERT'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                              : 'bg-blue-950 text-blue-300 border border-blue-800/40'
                          }`}
                        >
                          {ev.akcja}
                        </span>
                        <span className="font-bold text-zinc-200">{ev.tabela}</span>
                        <span className="text-zinc-500">• {ev.uzytkownik}</span>
                      </div>
                      <span className="text-zinc-500 text-[11px]">{ev.czas}</span>
                    </div>

                    <div className="text-[11px] text-zinc-400 pt-1">
                      {ev.stare && (
                        <div>
                          <span className="text-red-400">- OLD: </span>
                          {JSON.stringify(ev.stare)}
                        </div>
                      )}
                      <div>
                        <span className="text-emerald-400">+ NEW: </span>
                        {JSON.stringify(ev.nowe)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: INSTRUKCJA WDROŻENIA NA HOSTINGERZE */}
        {activeTab === 'guide' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-2 text-xs">
              <h3 className="font-bold text-emerald-300 text-sm">
                Instrukcja Wdrożenia Matchpoint CRM na Serwerze Hostinger VPS
              </h3>
              <p className="text-zinc-300">
                Poniższe kroki przeprowadzą Cię przez uruchomienie PostgreSQL 18 i NocoBase na Twoim serwerze VPS w Hostingerze w mniej niż 5 minut.
              </p>
            </div>

            {/* Step 1 */}
            <div className="p-5 bg-zinc-900 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h4 className="text-sm font-bold text-zinc-100">
                  Połączenie z Hostinger VPS przez SSH
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                Zaloguj się do swojego serwera VPS (dane znajdziesz w panelu hPanel Hostinger):
              </p>
              <pre className="p-3 bg-zinc-950 rounded-lg font-mono text-xs text-zinc-300 border border-[#27272a]">
                ssh root@TWOJ_IP_HOSTINGER
              </pre>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-zinc-900 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h4 className="text-sm font-bold text-zinc-100">
                  Instalacja Dockera i Docker Compose (jeśli nie zainstalowano)
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                W systemie Ubuntu/Debian wykonaj szybką instalację:
              </p>
              <pre className="p-3 bg-zinc-950 rounded-lg font-mono text-xs text-zinc-300 border border-[#27272a]">
                curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
              </pre>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-zinc-900 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <h4 className="text-sm font-bold text-zinc-100">
                  Utworzenie katalogu projektu i umieszczenie plików
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                Utwórz folder <code className="font-mono text-emerald-400">/opt/matchpoint-crm</code> i skopiuj pobrane pliki <code className="font-mono text-emerald-400">docker-compose.yml</code>, <code className="font-mono text-emerald-400">.env</code> oraz <code className="font-mono text-emerald-400">init.sql</code>:
              </p>
              <pre className="p-3 bg-zinc-950 rounded-lg font-mono text-xs text-zinc-300 border border-[#27272a]">
{`mkdir -p /opt/matchpoint-crm
cd /opt/matchpoint-crm

# Wklej zawartość docker-compose.yml, .env i init.sql do tego katalogu`}
              </pre>
            </div>

            {/* Step 4 */}
            <div className="p-5 bg-zinc-900 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <h4 className="text-sm font-bold text-zinc-100">
                  Uruchomienie kontenerów NocoBase + PostgreSQL 18
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                Uruchom cały stos w tle. Baza PostgreSQL 18 automatycznie wykona <code className="font-mono text-emerald-400">init.sql</code> i utworzy 12 tabel CRM:
              </p>
              <pre className="p-3 bg-zinc-950 rounded-lg font-mono text-xs text-zinc-300 border border-[#27272a]">
{`docker compose up -d

# Sprawdzenie statusu i logów:
docker compose logs -f nocobase`}
              </pre>
            </div>

            {/* Step 5 */}
            <div className="p-5 bg-zinc-900 border border-[#27272a] rounded-xl space-y-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <h4 className="text-sm font-bold text-zinc-100">
                  Dostęp do NocoBase i Synchronizacja Tabel CRM
                </h4>
              </div>
              <p className="text-xs text-zinc-400">
                Otwórz w przeglądarce adres swojego serwera:
              </p>
              <div className="p-3 bg-zinc-950 rounded-lg font-mono text-xs text-emerald-400 border border-[#27272a]">
                http://TWOJ_IP_HOSTINGER:13000
              </div>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside pt-1">
                <li>
                  Zaloguj się kontem administratora (np. <code className="font-mono text-zinc-100">admin@matchpoint-crm.pl</code> / hasłem z <code className="font-mono text-zinc-100">.env</code>).
                </li>
                <li>
                  Przejdź do <strong>Data Source Manager</strong> (Menedżer Źródeł Danych).
                </li>
                <li>
                  Kliknij <strong>"Sync from Database"</strong> (Synchronizuj z bazy danych) — NocoBase natychmiast załaduje wszystkie 12 tabel (<code className="font-mono text-emerald-400">kontakty, firmy, deale, aktywnosci...</code>) z ich relacjami kluczy obcych i typami danych!
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
