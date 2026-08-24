-- ============================================================================
-- MATCHPOINT CRM - Pełny Skrypt SQL dla PostgreSQL 18 & NocoBase
-- ============================================================================

-- 1. Rozszerzenia
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Tabela: Role
CREATE TABLE IF NOT EXISTS role (
    id BIGSERIAL PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL UNIQUE,
    uprawnienia JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Tabela: Użytkownicy (wstępna deklaracja)
CREATE TABLE IF NOT EXISTS uzytkownicy (
    id BIGSERIAL PRIMARY KEY,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    haslo_hash VARCHAR(255),
    rola_id BIGINT REFERENCES role(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Tabela: Zespoły (Teams)
CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    nazwa VARCHAR(150) NOT NULL UNIQUE,
    leader_id BIGINT REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Tabela: Firmy
CREATE TABLE IF NOT EXISTS firmy (
    id BIGSERIAL PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL,
    branza VARCHAR(100),
    rozmiar VARCHAR(50) CHECK (rozmiar IN ('Mikro', 'Małe', 'Średnie', 'Duże')),
    domain VARCHAR(255) UNIQUE,
    nadrzedna_firma_id BIGINT REFERENCES firmy(id) ON DELETE SET NULL,
    owner_id BIGINT REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Tabela: Kontakty
CREATE TABLE IF NOT EXISTS kontakty (
    id BIGSERIAL PRIMARY KEY,
    imie VARCHAR(100) NOT NULL,
    nazwisko VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefon VARCHAR(50),
    firma_id BIGINT REFERENCES firmy(id) ON DELETE SET NULL,
    owner_id BIGINT REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    lifecycle_status VARCHAR(50) DEFAULT 'Lead' CHECK (lifecycle_status IN ('Lead', 'Kontakt', 'Klient', 'Były Klient')),
    zrodlo VARCHAR(50) DEFAULT 'Manualny' CHECK (zrodlo IN ('HubSpot', 'Manualny', 'Import')),
    consent BOOLEAN DEFAULT FALSE NOT NULL,
    wlasciwosci JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Tabela: Pipelines
CREATE TABLE IF NOT EXISTS pipelines (
    id BIGSERIAL PRIMARY KEY,
    nazwa VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Tabela: Etapy
CREATE TABLE IF NOT EXISTS etapy (
    id BIGSERIAL PRIMARY KEY,
    nazwa VARCHAR(100) NOT NULL,
    pipeline_id BIGINT NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    prawdopodobienstwo INT DEFAULT 20 CHECK (prawdopodobienstwo BETWEEN 0 AND 100),
    kolejnosc INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. Tabela: Deale
CREATE TABLE IF NOT EXISTS deale (
    id BIGSERIAL PRIMARY KEY,
    nazwa VARCHAR(255) NOT NULL,
    wartosc NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    waluta VARCHAR(3) DEFAULT 'PLN' CHECK (waluta IN ('PLN', 'EUR', 'USD')),
    pipeline_id BIGINT NOT NULL REFERENCES pipelines(id) ON DELETE RESTRICT,
    etap_id BIGINT NOT NULL REFERENCES etapy(id) ON DELETE RESTRICT,
    data_zamkniecia DATE,
    prawdopodobienstwo INT DEFAULT 50 CHECK (prawdopodobienstwo BETWEEN 0 AND 100),
    owner_id BIGINT REFERENCES uzytkownicy(id) ON DELETE SET NULL,
    team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. Tabela: Aktywności
CREATE TABLE IF NOT EXISTS aktywnosci (
    id BIGSERIAL PRIMARY KEY,
    typ VARCHAR(50) NOT NULL CHECK (typ IN ('Notatka', 'Zadanie', 'Telefoniczny', 'Spotkanie')),
    tresc TEXT NOT NULL,
    data TIMESTAMPTZ NOT NULL,
    kontakt_id BIGINT REFERENCES kontakty(id) ON DELETE SET NULL,
    deal_id BIGINT REFERENCES deale(id) ON DELETE SET NULL,
    uzytkownik_id BIGINT NOT NULL REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Tabela: Powiązania (Verknüpfungen)
CREATE TABLE IF NOT EXISTS powiazania (
    id BIGSERIAL PRIMARY KEY,
    typ VARCHAR(100) NOT NULL,
    obiekt1_id BIGINT NOT NULL,
    obiekt1_typ VARCHAR(100) NOT NULL,
    obiekt2_id BIGINT NOT NULL,
    obiekt2_typ VARCHAR(100) NOT NULL,
    rola VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 12. Tabela: Właściwości (Eigenschaften)
CREATE TABLE IF NOT EXISTS wlasciwosci (
    id BIGSERIAL PRIMARY KEY,
    nazwa VARCHAR(150) NOT NULL,
    typ VARCHAR(50) NOT NULL CHECK (typ IN ('Text', 'Number', 'Boolean', 'Select', 'Date', 'User')),
    kolekcja VARCHAR(50) NOT NULL CHECK (kolekcja IN ('Kontakty', 'Firmy', 'Deale')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 13. Tabela: Widoki (Ansichten)
CREATE TABLE IF NOT EXISTS widoki (
    id BIGSERIAL PRIMARY KEY,
    nazwa VARCHAR(150) NOT NULL,
    kolekcja VARCHAR(100) NOT NULL,
    filtry JSONB DEFAULT '{}'::jsonb NOT NULL,
    kolumny JSONB DEFAULT '[]'::jsonb NOT NULL,
    sortowanie JSONB DEFAULT '[]'::jsonb NOT NULL,
    publiczny BOOLEAN DEFAULT FALSE NOT NULL,
    uzytkownik_id BIGINT REFERENCES uzytkownicy(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 14. Tabela: Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    akcja VARCHAR(20) NOT NULL,
    kolekcja VARCHAR(100) NOT NULL,
    obiekt_id BIGINT NOT NULL,
    uzytkownik_id BIGINT,
    stare_dane JSONB,
    nowe_dane JSONB,
    data TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ============================================================================
-- INDEKSY
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_kontakty_email ON kontakty (email);
CREATE INDEX IF NOT EXISTS idx_kontakty_owner_id ON kontakty (owner_id);
CREATE INDEX IF NOT EXISTS idx_firmy_domain ON firmy (domain);
CREATE INDEX IF NOT EXISTS idx_firmy_owner_id ON firmy (owner_id);
CREATE INDEX IF NOT EXISTS idx_deale_data_zamkniecia ON deale (data_zamkniecia);
CREATE INDEX IF NOT EXISTS idx_deale_owner_id ON deale (owner_id);
CREATE INDEX IF NOT EXISTS idx_deale_team_id ON deale (team_id);
CREATE INDEX IF NOT EXISTS idx_aktywnosci_uzytkownik ON aktywnosci (uzytkownik_id);

-- ============================================================================
-- TRIGGER AUDYTOWY DO TABELI audit_log
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_audit_crm_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id BIGINT;
BEGIN
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_log (akcja, kolekcja, obiekt_id, uzytkownik_id, stare_dane, nowe_dane)
        VALUES ('CREATE', TG_TABLE_NAME, NEW.id, v_user_id, NULL, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_log (akcja, kolekcja, obiekt_id, uzytkownik_id, stare_dane, nowe_dane)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, v_user_id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_log (akcja, kolekcja, obiekt_id, uzytkownik_id, stare_dane, nowe_dane)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, v_user_id, to_jsonb(OLD), NULL);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_kontakty AFTER INSERT OR UPDATE OR DELETE ON kontakty FOR EACH ROW EXECUTE FUNCTION fn_audit_crm_changes();
CREATE TRIGGER trg_audit_firmy AFTER INSERT OR UPDATE OR DELETE ON firmy FOR EACH ROW EXECUTE FUNCTION fn_audit_crm_changes();
CREATE TRIGGER trg_audit_deale AFTER INSERT OR UPDATE OR DELETE ON deale FOR EACH ROW EXECUTE FUNCTION fn_audit_crm_changes();
CREATE TRIGGER trg_audit_aktywnosci AFTER INSERT OR UPDATE OR DELETE ON aktywnosci FOR EACH ROW EXECUTE FUNCTION fn_audit_crm_changes();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE kontakty ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmy ENABLE ROW LEVEL SECURITY;
ALTER TABLE deale ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION fn_current_user_id() RETURNS BIGINT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION fn_is_admin_or_manager() RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('app.current_user_role', true) IN ('Admin', 'Manager');
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Kontakty RLS: Handlowiec widzi swoje kontakty, Admin/Manager widzi wszystkie
CREATE POLICY rls_kontakty_select ON kontakty FOR SELECT
USING (fn_is_admin_or_manager() OR owner_id = fn_current_user_id());

CREATE POLICY rls_kontakty_mod ON kontakty FOR ALL
USING (fn_is_admin_or_manager() OR owner_id = fn_current_user_id());

-- Deale RLS: Handlowiec widzi swoje szanse
CREATE POLICY rls_deale_select ON deale FOR SELECT
USING (fn_is_admin_or_manager() OR owner_id = fn_current_user_id());

CREATE POLICY rls_deale_mod ON deale FOR ALL
USING (fn_is_admin_or_manager() OR owner_id = fn_current_user_id());
