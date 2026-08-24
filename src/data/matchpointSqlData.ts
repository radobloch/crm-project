export const MATCHPOINT_DOCKER_COMPOSE = `version: '3.8'

services:
  # ==========================================================
  # PostgreSQL 18 Database Container for Matchpoint CRM
  # ==========================================================
  postgres:
    image: postgres:18-alpine
    container_name: matchpoint_postgres18
    restart: unless-stopped
    environment:
      POSTGRES_DB: \${DB_NAME:-matchpoint_crm}
      POSTGRES_USER: \${DB_USER:-nocobase_admin}
      POSTGRES_PASSWORD: \${DB_PASSWORD:-TwOje_b4rdzo_bEzp1eczNe_h4sLo_2026!}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      # Persistent database storage on Hostinger VPS
      - pgdata:/var/lib/postgresql/data
      # Automated initialization script (12 tables, RLS, pg_trgm, triggers)
      - ./init.sql:/docker-entrypoint-initdb.d/01-init.sql:ro
    ports:
      # Optional: bind to localhost only on VPS for external safety
      - "127.0.0.1:5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-nocobase_admin} -d \${DB_NAME:-matchpoint_crm}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - matchpoint_net
    deploy:
      resources:
        limits:
          memory: 2G

  # ==========================================================
  # NocoBase Main Application Container
  # ==========================================================
  nocobase:
    image: nocobase/nocobase:latest
    container_name: matchpoint_nocobase
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      # Application Core Config
      NODE_ENV: production
      APP_KEY: \${APP_KEY:-mp_crm_secure_secret_key_random_64_chars_here}
      APP_PORT: 13000
      
      # Primary Database Connection
      DB_DIALECT: postgres
      DB_HOST: postgres
      DB_PORT: 5432
      DB_DATABASE: \${DB_NAME:-matchpoint_crm}
      DB_USER: \${DB_USER:-nocobase_admin}
      DB_PASSWORD: \${DB_PASSWORD:-TwOje_b4rdzo_bEzp1eczNe_h4sLo_2026!}
      DB_SCHEMA: public
      DB_TIMEZONE: "+01:00"
      
      # Plugin & Feature Configuration
      NOCOBASE_LOCALE: pl-PL
      INIT_ROOT_EMAIL: \${ADMIN_EMAIL:-admin@matchpoint-crm.pl}
      INIT_ROOT_PASSWORD: \${ADMIN_PASSWORD:-AdminMatchpoint2026!}
      INIT_ROOT_NICKNAME: "Administrator Matchpoint"
      
      # File Storage & Uploads
      LOCAL_STORAGE_DEST: /app/nocobase/storage/uploads
    volumes:
      # Persistent storage for user attachments and app cache
      - nocobase_storage:/app/nocobase/storage
    ports:
      # Public NocoBase Port (can be proxied via Nginx / Caddy on Hostinger)
      - "13000:13000"
    networks:
      - matchpoint_net

volumes:
  pgdata:
    driver: local
  nocobase_storage:
    driver: local

networks:
  matchpoint_net:
    driver: bridge
`;

export const MATCHPOINT_ENV_TEMPLATE = `# ==========================================================
# Matchpoint CRM - Environment Variables for Hostinger VPS
# ==========================================================

# Database Credentials
DB_NAME=matchpoint_crm
DB_USER=nocobase_admin
DB_PASSWORD=TwOje_b4rdzo_bEzp1eczNe_h4sLo_2026!

# Application Secrets
APP_KEY=9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a

# NocoBase Root Account (First initialization)
ADMIN_EMAIL=admin@matchpoint-crm.pl
ADMIN_PASSWORD=AdminMatchpoint2026!

# Server Hostinger Domain (if using reverse proxy)
DOMAIN=crm.twoja-domena-hostinger.pl
`;

export const MATCHPOINT_INIT_SQL = `-- ============================================================================
-- MATCHPOINT CRM - PostgreSQL 18 Production Initialization Script
-- 12 Tabel, Polskie Nazwy Kolumn, pg_trgm GIN, Row Level Security (RLS) & Triggery Audit
-- ============================================================================

-- 1. Rozszerzenia (Extensions)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- 2. Tworzenie schematów i typów wyliczeniowych (ENUM)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'typ_roli_uzytkownika') THEN
        CREATE TYPE typ_roli_uzytkownika AS ENUM ('super_admin', 'admin', 'manager', 'handlowiec', 'obserwator');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_deala') THEN
        CREATE TYPE status_deala AS ENUM ('otwarty', 'wygrany', 'przegrany', 'zawieszony');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priorytet_deala') THEN
        CREATE TYPE priorytet_deala AS ENUM ('niski', 'sredni', 'wysoki', 'pilny');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'typ_aktywnosci') THEN
        CREATE TYPE typ_aktywnosci AS ENUM ('telefon', 'spotkanie', 'email', 'zadanie', 'notatka', 'prezentacja');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_aktywnosci') THEN
        CREATE TYPE status_aktywnosci AS ENUM ('zaplanowane', 'w_trakcie', 'zakonczone', 'anulowane');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'typ_encji') THEN
        CREATE TYPE typ_encji AS ENUM ('kontakt', 'firma', 'deal', 'aktywnosc', 'zespol');
    END IF;
END $$;

-- ============================================================================
-- TABELA 1: ZESPOŁY (Teams)
-- ============================================================================
CREATE TABLE IF NOT EXISTS zespoly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nazwa VARCHAR(150) NOT NULL UNIQUE,
    kod VARCHAR(50) UNIQUE,
    opis TEXT,
    aktywny BOOLEAN DEFAULT TRUE NOT NULL,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zaktualizowano_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 2: UŻYTKOWNICY (Nutzer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS uzytkownicy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    haslo_hash VARCHAR(255),
    telefon VARCHAR(50),
    stanowisko VARCHAR(100),
    rola typ_roli_uzytkownika DEFAULT 'handlowiec' NOT NULL,
    zespol_id UUID REFERENCES zespoly(id) ON DELETE SET NULL,
    avatar_url TEXT,
    aktywny BOOLEAN DEFAULT TRUE NOT NULL,
    ostatnie_logowanie TIMESTAMPTZ,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zaktualizowano_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 3: FIRMY (Firmy)
-- ============================================================================
CREATE TABLE IF NOT EXISTS firmy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nazwa VARCHAR(200) NOT NULL,
    domena VARCHAR(150),
    nip VARCHAR(20),
    regon VARCHAR(20),
    krs VARCHAR(20),
    branza VARCHAR(100),
    wielkosc_zatrudnienia VARCHAR(50), -- np. '1-10', '11-50', '51-200', '200+'
    telefon VARCHAR(50),
    email VARCHAR(255),
    adres_ulica VARCHAR(200),
    adres_miasto VARCHAR(100),
    adres_kod_pocztowy VARCHAR(20),
    adres_kraj VARCHAR(100) DEFAULT 'Polska',
    strona_www VARCHAR(255),
    linkedin_url VARCHAR(255),
    roczny_obrot NUMERIC(15, 2),
    wlasciciel_id UUID REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    zespol_id UUID REFERENCES zespoly(id) ON DELETE SET NULL,
    notatki TEXT,
    wlasciwosci_niestandardowe JSONB DEFAULT '{}'::jsonb,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zaktualizowano_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 4: KONTAKTY (Kontakty)
-- ============================================================================
CREATE TABLE IF NOT EXISTS kontakty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefon VARCHAR(50),
    telefon_komorkowy VARCHAR(50),
    stanowisko VARCHAR(100),
    dzial VARCHAR(100),
    firma_id UUID REFERENCES firmy(id) ON DELETE SET NULL,
    wlasciciel_id UUID REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    zespol_id UUID REFERENCES zespoly(id) ON DELETE SET NULL,
    linkedin_url VARCHAR(255),
    zgoda_marketingowa BOOLEAN DEFAULT FALSE NOT NULL,
    notatki TEXT,
    wlasciwosci_niestandardowe JSONB DEFAULT '{}'::jsonb,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zaktualizowano_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 5: PIPELINE (Lejki Sprzedażowe)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pipeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nazwa VARCHAR(150) NOT NULL,
    kod VARCHAR(50) UNIQUE NOT NULL,
    opis TEXT,
    domyslny BOOLEAN DEFAULT FALSE NOT NULL,
    aktywny BOOLEAN DEFAULT TRUE NOT NULL,
    zespol_id UUID REFERENCES zespoly(id) ON DELETE SET NULL,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zaktualizowano_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 6: ETAPY (Stufen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS etapy_stufen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipeline(id) ON DELETE CASCADE,
    nazwa VARCHAR(100) NOT NULL,
    kolejnosc INT DEFAULT 1 NOT NULL,
    prawdopodobienstwo INT DEFAULT 10 NOT NULL CHECK (prawdopodobienstwo >= 0 AND prawdopodobienstwo <= 100),
    kolor_hex VARCHAR(10) DEFAULT '#3b82f6',
    wymagane_pola TEXT[],
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 7: DEALE (Szanse Sprzedaży)
-- ============================================================================
CREATE TABLE IF NOT EXISTS deale (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nazwa VARCHAR(250) NOT NULL,
    wartosc NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    waluta VARCHAR(3) DEFAULT 'PLN' NOT NULL,
    pipeline_id UUID NOT NULL REFERENCES pipeline(id) ON DELETE RESTRICT,
    etap_id UUID NOT NULL REFERENCES etapy_stufen(id) ON DELETE RESTRICT,
    firma_id UUID REFERENCES firmy(id) ON DELETE SET NULL,
    kontakt_glowny_id UUID REFERENCES kontakty(id) ON DELETE SET NULL,
    wlasciciel_id UUID REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    zespol_id UUID REFERENCES zespoly(id) ON DELETE SET NULL,
    status status_deala DEFAULT 'otwarty' NOT NULL,
    priorytet priorytet_deala DEFAULT 'sredni' NOT NULL,
    spodziewana_data_zamkniecia DATE,
    rzeczywista_data_zamkniecia DATE,
    powod_przegranej TEXT,
    notatki TEXT,
    wlasciwosci_niestandardowe JSONB DEFAULT '{}'::jsonb,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zaktualizowano_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 8: AKTYWNOŚCI (Aktywności: Spotkania, Telefony, Zadania)
-- ============================================================================
CREATE TABLE IF NOT EXISTS aktywnosci (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    typ typ_aktywnosci DEFAULT 'zadanie' NOT NULL,
    tytul VARCHAR(255) NOT NULL,
    opis TEXT,
    termin_od TIMESTAMPTZ,
    termin_do TIMESTAMPTZ,
    caly_dzien BOOLEAN DEFAULT FALSE,
    status status_aktywnosci DEFAULT 'zaplanowane' NOT NULL,
    lokalizacja VARCHAR(255),
    kontakt_id UUID REFERENCES kontakty(id) ON DELETE SET NULL,
    firma_id UUID REFERENCES firmy(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deale(id) ON DELETE SET NULL,
    wykonawca_id UUID REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    zespol_id UUID REFERENCES zespoly(id) ON DELETE SET NULL,
    stworzono_przez UUID REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zaktualizowano_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 9: POWIĄZANIA M:N (Verknüpfungen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS powiazania_verknuepfungen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    typ_zrodla typ_encji NOT NULL,
    zrodlo_id UUID NOT NULL,
    typ_celu typ_encji NOT NULL,
    cel_id UUID NOT NULL,
    rola_powiazania VARCHAR(100) DEFAULT 'partner',
    opis TEXT,
    stworzono_przez UUID REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unikalne_powiazanie UNIQUE (typ_zrodla, zrodlo_id, typ_celu, cel_id, rola_powiazania)
);

-- ============================================================================
-- TABELA 10: WŁAŚCIWOŚCI NIESTANDARDOWE (Eigenschaften)
-- ============================================================================
CREATE TABLE IF NOT EXISTS wlasciwosci_eigenschaften (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encja typ_encji NOT NULL,
    klucz VARCHAR(100) NOT NULL,
    etykieta VARCHAR(150) NOT NULL,
    typ_danych VARCHAR(50) NOT NULL, -- 'tekst', 'liczba', 'data', 'slownik', 'wielokrotny_wybor', 'bool'
    wymagane BOOLEAN DEFAULT FALSE NOT NULL,
    domyslna_wartosc JSONB,
    opcje_wyboru JSONB DEFAULT '[]'::jsonb,
    kolejnosc INT DEFAULT 1,
    aktywne BOOLEAN DEFAULT TRUE NOT NULL,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unikalna_wlasciwosc_dla_encji UNIQUE (encja, klucz)
);

-- ============================================================================
-- TABELA 11: WIDOKI I FILTRY (Ansichten)
-- ============================================================================
CREATE TABLE IF NOT EXISTS widoki_ansichten (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uzytkownik_id UUID REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    zespol_id UUID REFERENCES zespoly(id) ON DELETE CASCADE,
    encja typ_encji NOT NULL,
    nazwa VARCHAR(150) NOT NULL,
    typ_widoku VARCHAR(50) DEFAULT 'tabela' NOT NULL, -- 'tabela', 'kanban', 'kalendarz', 'wykres'
    konfiguracja_filtrow JSONB DEFAULT '{}'::jsonb NOT NULL,
    konfiguracja_kolumn JSONB DEFAULT '[]'::jsonb NOT NULL,
    konfiguracja_sortowania JSONB DEFAULT '[]'::jsonb NOT NULL,
    jest_domyslny BOOLEAN DEFAULT FALSE NOT NULL,
    jest_publiczny BOOLEAN DEFAULT FALSE NOT NULL,
    stworzono_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    zaktualizowano_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- TABELA 12: DZIENNIK AUDYTU (Audit-Log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    nazwa_tabeli VARCHAR(100) NOT NULL,
    rekord_id UUID NOT NULL,
    akcja VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    stare_wartosci JSONB,
    nowe_wartosci JSONB,
    zmienione_pola TEXT[],
    uzytkownik_id UUID,
    adres_ip INET,
    user_agent TEXT,
    czas_zdarzenia TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- INDEKSY WYDAJNOŚCIOWE B-TREE ORAZ GIN (pg_trgm dla wyszukiwania pełnotekstowego)
-- ============================================================================

-- 1. Standardowe indeksy B-Tree
CREATE INDEX IF NOT EXISTS idx_kontakty_email ON kontakty (email);
CREATE INDEX IF NOT EXISTS idx_kontakty_firma_id ON kontakty (firma_id);
CREATE INDEX IF NOT EXISTS idx_kontakty_wlasciciel_id ON kontakty (wlasciciel_id);
CREATE INDEX IF NOT EXISTS idx_kontakty_zespol_id ON kontakty (zespol_id);

CREATE INDEX IF NOT EXISTS idx_firmy_domena ON firmy (domena);
CREATE INDEX IF NOT EXISTS idx_firmy_nip ON firmy (nip);
CREATE INDEX IF NOT EXISTS idx_firmy_wlasciciel_id ON firmy (wlasciciel_id);
CREATE INDEX IF NOT EXISTS idx_firmy_zespol_id ON firmy (zespol_id);

CREATE INDEX IF NOT EXISTS idx_deale_pipeline_etap ON deale (pipeline_id, etap_id);
CREATE INDEX IF NOT EXISTS idx_deale_status ON deale (status);
CREATE INDEX IF NOT EXISTS idx_deale_firma_id ON deale (firma_id);
CREATE INDEX IF NOT EXISTS idx_deale_wlasciciel_id ON deale (wlasciciel_id);
CREATE INDEX IF NOT EXISTS idx_deale_zespol_id ON deale (zespol_id);

CREATE INDEX IF NOT EXISTS idx_aktywnosci_termin_od ON aktywnosci (termin_od);
CREATE INDEX IF NOT EXISTS idx_aktywnosci_wykonawca ON aktywnosci (wykonawca_id);
CREATE INDEX IF NOT EXISTS idx_aktywnosci_deal ON aktywnosci (deal_id);
CREATE INDEX IF NOT EXISTS idx_aktywnosci_kontakt ON aktywnosci (kontakt_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_tabela_rekord ON audit_log (nazwa_tabeli, rekord_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_czas ON audit_log (czas_zdarzenia DESC);

-- 2. Indeksy GIN Trigram (pg_trgm) - Błyskawiczne wyszukiwanie rozmyte i ILIKE
CREATE INDEX IF NOT EXISTS idx_kontakty_trgm_imie_nazwisko ON kontakty USING gin ((imie || ' ' || nazwisko) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kontakty_trgm_email ON kontakty USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_firmy_trgm_nazwa ON firmy USING gin (nazwa gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_firmy_trgm_domena ON firmy USING gin (domena gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_deale_trgm_nazwa ON deale USING gin (nazwa gin_trgm_ops);

-- ============================================================================
-- AUTOMATYCZNY TRIGGER AUDYTOWY DLA TABELI AUDIT_LOG
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_changed_fields TEXT[] := ARRAY[]::TEXT[];
    v_record_id UUID;
    v_user_id UUID;
    key TEXT;
BEGIN
    -- Pobranie ID użytkownika z sesji aplikacji (NocoBase / context)
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'INSERT') THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;
        
        INSERT INTO audit_log (nazwa_tabeli, rekord_id, akcja, stare_wartosci, nowe_wartosci, zmienione_pola, uzytkownik_id)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, NULL, v_new_data, NULL, v_user_id);
        RETURN NEW;

    ELSIF (TG_OP = 'UPDATE') THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := NEW.id;

        -- Porównanie pól JSONB w celu wyłonienia zmienionych kolumn
        FOR key IN SELECT jsonb_object_keys(v_new_data)
        LOOP
            IF (v_old_data->key IS DISTINCT FROM v_new_data->key) THEN
                v_changed_fields := array_append(v_changed_fields, key);
            END IF;
        END LOOP;

        IF array_length(v_changed_fields, 1) > 0 THEN
            INSERT INTO audit_log (nazwa_tabeli, rekord_id, akcja, stare_wartosci, nowe_wartosci, zmienione_pola, uzytkownik_id)
            VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_old_data, v_new_data, v_changed_fields, v_user_id);
        END IF;
        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := OLD.id;
        
        INSERT INTO audit_log (nazwa_tabeli, rekord_id, akcja, stare_wartosci, nowe_wartosci, zmienione_pola, uzytkownik_id)
        VALUES (TG_TABLE_NAME, v_record_id, TG_OP, v_old_data, NULL, NULL, v_user_id);
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Podpięcie triggera audytowego do głównych tabel biznesowych
DROP TRIGGER IF EXISTS trg_audit_kontakty ON kontakty;
CREATE TRIGGER trg_audit_kontakty
AFTER INSERT OR UPDATE OR DELETE ON kontakty
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_firmy ON firmy;
CREATE TRIGGER trg_audit_firmy
AFTER INSERT OR UPDATE OR DELETE ON firmy
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_deale ON deale;
CREATE TRIGGER trg_audit_deale
AFTER INSERT OR UPDATE OR DELETE ON deale
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_aktywnosci ON aktywnosci;
CREATE TRIGGER trg_audit_aktywnosci
AFTER INSERT OR UPDATE OR DELETE ON aktywnosci
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

DROP TRIGGER IF EXISTS trg_audit_pipeline ON pipeline;
CREATE TRIGGER trg_audit_pipeline
AFTER INSERT OR UPDATE OR DELETE ON pipeline
FOR EACH ROW EXECUTE FUNCTION fn_audit_log_trigger();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - ROLLEN & RECHTE (Polityki Bezpieczeństwa Wierszy)
-- ============================================================================

-- Włączenie RLS dla kluczowych tabel danych
ALTER TABLE kontakty ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmy ENABLE ROW LEVEL SECURITY;
ALTER TABLE deale ENABLE ROW LEVEL SECURITY;
ALTER TABLE aktywnosci ENABLE ROW LEVEL SECURITY;

-- Funkcja pomocnicza sprawdzająca uprawnienia (Super Admin i Admin mają pełen dostęp)
CREATE OR REPLACE FUNCTION fn_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('app.current_user_role', true) IN ('super_admin', 'admin');
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Funkcja pomocnicza pobierająca aktualne ID użytkownika
CREATE OR REPLACE FUNCTION fn_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Funkcja pomocnicza pobierająca aktualne ID zespołu użytkownika
CREATE OR REPLACE FUNCTION fn_current_team_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_team_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- POLITYKI RLS DLA TABELI: KONTAKTY
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS p_kontakty_select ON kontakty;
CREATE POLICY p_kontakty_select ON kontakty
FOR SELECT USING (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (zespol_id IS NOT NULL AND zespol_id = fn_current_team_id()) OR
    current_setting('app.current_user_role', true) = 'manager'
);

DROP POLICY IF EXISTS p_kontakty_modify ON kontakty;
CREATE POLICY p_kontakty_modify ON kontakty
FOR ALL USING (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (current_setting('app.current_user_role', true) = 'manager' AND zespol_id = fn_current_team_id())
) WITH CHECK (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (current_setting('app.current_user_role', true) = 'manager' AND zespol_id = fn_current_team_id())
);

-- ----------------------------------------------------------------------------
-- POLITYKI RLS DLA TABELI: FIRMY
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS p_firmy_select ON firmy;
CREATE POLICY p_firmy_select ON firmy
FOR SELECT USING (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (zespol_id IS NOT NULL AND zespol_id = fn_current_team_id()) OR
    current_setting('app.current_user_role', true) = 'manager'
);

DROP POLICY IF EXISTS p_firmy_modify ON firmy;
CREATE POLICY p_firmy_modify ON firmy
FOR ALL USING (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (current_setting('app.current_user_role', true) = 'manager' AND zespol_id = fn_current_team_id())
) WITH CHECK (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (current_setting('app.current_user_role', true) = 'manager' AND zespol_id = fn_current_team_id())
);

-- ----------------------------------------------------------------------------
-- POLITYKI RLS DLA TABELI: DEALE
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS p_deale_select ON deale;
CREATE POLICY p_deale_select ON deale
FOR SELECT USING (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (zespol_id IS NOT NULL AND zespol_id = fn_current_team_id()) OR
    current_setting('app.current_user_role', true) = 'manager'
);

DROP POLICY IF EXISTS p_deale_modify ON deale;
CREATE POLICY p_deale_modify ON deale
FOR ALL USING (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (current_setting('app.current_user_role', true) = 'manager' AND zespol_id = fn_current_team_id())
) WITH CHECK (
    fn_is_admin() OR
    wlasciciel_id = fn_current_user_id() OR
    (current_setting('app.current_user_role', true) = 'manager' AND zespol_id = fn_current_team_id())
);

-- ----------------------------------------------------------------------------
-- POLITYKI RLS DLA TABELI: AKTYWNOŚCI
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS p_aktywnosci_select ON aktywnosci;
CREATE POLICY p_aktywnosci_select ON aktywnosci
FOR SELECT USING (
    fn_is_admin() OR
    wykonawca_id = fn_current_user_id() OR
    stworzono_przez = fn_current_user_id() OR
    (zespol_id IS NOT NULL AND zespol_id = fn_current_team_id())
);

DROP POLICY IF EXISTS p_aktywnosci_modify ON aktywnosci;
CREATE POLICY p_aktywnosci_modify ON aktywnosci
FOR ALL USING (
    fn_is_admin() OR
    wykonawca_id = fn_current_user_id() OR
    stworzono_przez = fn_current_user_id()
) WITH CHECK (
    fn_is_admin() OR
    wykonawca_id = fn_current_user_id() OR
    stworzono_przez = fn_current_user_id()
);

-- ============================================================================
-- DANE POCZĄTKOWE (SEED DATA)
-- ============================================================================

-- Domyślne zespoły
INSERT INTO zespoly (id, nazwa, kod, opis)
VALUES 
  ('a1000000-0000-0000-0000-000000000001', 'Zespół Sprzedaży Enterprise', 'SALES_ENT', 'Obsługa kluczowych klientów B2B w Polsce i DACH'),
  ('a2000000-0000-0000-0000-000000000002', 'Zespół Sprzedaży SMB', 'SALES_SMB', 'Szybki cykl sprzedażowy dla małych i średnich przedsiębiorstw')
ON CONFLICT (nazwa) DO NOTHING;

-- Domyślny pipeline i etapy
INSERT INTO pipeline (id, nazwa, kod, opis, domyslny)
VALUES 
  ('b1000000-0000-0000-0000-000000000001', 'Główny Lejek B2B', 'MAIN_B2B_PIPELINE', 'Standardowy cykl sprzedaży usług i produktów Matchpoint CRM', TRUE)
ON CONFLICT (kod) DO NOTHING;

INSERT INTO etapy_stufen (pipeline_id, nazwa, kolejnosc, prawdopodobienstwo, kolor_hex)
VALUES
  ('b1000000-0000-0000-0000-000000000001', '1. Nowy Lead / Inbound', 1, 10, '#94a3b8'),
  ('b1000000-0000-0000-0000-000000000001', '2. Kwalifikacja BANT', 2, 30, '#38bdf8'),
  ('b1000000-0000-0000-0000-000000000001', '3. Prezentacja Demo', 3, 50, '#fbbf24'),
  ('b1000000-0000-0000-0000-000000000001', '4. Oferta i Negocjacje', 4, 75, '#a855f7'),
  ('b1000000-0000-0000-0000-000000000001', '5. Wygrana (Closed Won)', 5, 100, '#22c55e'),
  ('b1000000-0000-0000-0000-000000000001', '6. Przegrana (Closed Lost)', 6, 0, '#ef4444')
ON CONFLICT DO NOTHING;
`;
