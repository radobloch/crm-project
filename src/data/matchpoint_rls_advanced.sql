-- ============================================================================
-- MATCHPOINT CRM: Pełny Skrypt Row Level Security (RLS) dla PostgreSQL 18
-- Obsługa ról: super_admin, vertriebsleitung, team_lead, sales_rep, marketing, controlling
-- ============================================================================

-- 1. Włączenie RLS na wszystkich kluczowych tabelach CRM
ALTER TABLE kontakty ENABLE ROW LEVEL SECURITY;
ALTER TABLE firmy ENABLE ROW LEVEL SECURITY;
ALTER TABLE deale ENABLE ROW LEVEL SECURITY;
ALTER TABLE aktywnosci ENABLE ROW LEVEL SECURITY;

-- 2. Funkcje pomocnicze do weryfikacji kontekstu użytkownika
CREATE OR REPLACE FUNCTION current_app_role() RETURNS VARCHAR AS $$
BEGIN
    RETURN COALESCE(current_setting('app.current_user_role', true), 'sales_rep');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS BIGINT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION current_app_team_id() RETURNS BIGINT AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_team_id', true), '')::BIGINT;
END;
$$ LANGUAGE plpgsql STABLE;

-- Czyszczenie istniejących polityk przed ich ponownym nałożeniem
DROP POLICY IF EXISTS rls_kontakty_policy ON kontakty;
DROP POLICY IF EXISTS rls_firmy_policy ON firmy;
DROP POLICY IF EXISTS rls_deale_policy ON deale;
DROP POLICY IF EXISTS rls_aktywnosci_policy ON aktywnosci;

-- ============================================================================
-- 3. POLITYKI DLA TABELI: KONTAKTY
-- ============================================================================
CREATE POLICY rls_kontakty_select ON kontakty
FOR SELECT USING (
    -- Super Admin, Vertriebsleitung, Marketing, Controlling widzą wszystko
    current_app_role() IN ('super_admin', 'vertriebsleitung', 'marketing', 'controlling')
    -- Team-Lead widzi kontakty należące do członków swojego teamu (poprzez owner_id)
    OR (current_app_role() = 'team_lead' AND (
        owner_id IN (SELECT id FROM uzytkownicy WHERE team_id = current_app_team_id())
        OR owner_id IS NULL
    ))
    -- Sales Rep widzi tylko własne rekordy oraz kontakty nieprzypisane (owner_id IS NULL)
    OR (current_app_role() = 'sales_rep' AND (owner_id = current_app_user_id() OR owner_id IS NULL))
);

CREATE POLICY rls_kontakty_insert ON kontakty
FOR INSERT WITH CHECK (
    current_app_role() IN ('super_admin', 'vertriebsleitung', 'marketing')
    OR (current_app_role() = 'team_lead')
    OR (current_app_role() = 'sales_rep' AND (owner_id = current_app_user_id() OR owner_id IS NULL))
);

CREATE POLICY rls_kontakty_update ON kontakty
FOR UPDATE USING (
    current_app_role() IN ('super_admin', 'vertriebsleitung', 'marketing')
    OR (current_app_role() = 'team_lead' AND (
        owner_id IN (SELECT id FROM uzytkownicy WHERE team_id = current_app_team_id())
        OR owner_id IS NULL
    ))
    OR (current_app_role() = 'sales_rep' AND (owner_id = current_app_user_id() OR owner_id IS NULL))
);

CREATE POLICY rls_kontakty_delete ON kontakty
FOR DELETE USING (
    current_app_role() IN ('super_admin', 'vertriebsleitung')
);

-- ============================================================================
-- 4. POLITYKI DLA TABELI: FIRMY
-- ============================================================================
CREATE POLICY rls_firmy_select ON firmy
FOR SELECT USING (
    current_app_role() IN ('super_admin', 'vertriebsleitung', 'marketing', 'controlling')
    OR (current_app_role() = 'team_lead' AND (
        owner_id IN (SELECT id FROM uzytkownicy WHERE team_id = current_app_team_id())
        OR owner_id IS NULL
    ))
    OR (current_app_role() = 'sales_rep' AND (owner_id = current_app_user_id() OR owner_id IS NULL))
);

CREATE POLICY rls_firmy_modify ON firmy
FOR ALL USING (
    current_app_role() IN ('super_admin', 'vertriebsleitung')
    OR (current_app_role() = 'team_lead' AND (
        owner_id IN (SELECT id FROM uzytkownicy WHERE team_id = current_app_team_id())
        OR owner_id IS NULL
    ))
    OR (current_app_role() = 'sales_rep' AND (owner_id = current_app_user_id() OR owner_id IS NULL))
);

-- ============================================================================
-- 5. POLITYKI DLA TABELI: DEALE (Szanse Sprzedaży)
-- ============================================================================
CREATE POLICY rls_deale_select ON deale
FOR SELECT USING (
    -- Marketing NIE MA dostępu do dealów
    current_app_role() != 'marketing' AND (
        current_app_role() IN ('super_admin', 'vertriebsleitung', 'controlling')
        OR (current_app_role() = 'team_lead' AND (team_id = current_app_team_id() OR owner_id IN (SELECT id FROM uzytkownicy WHERE team_id = current_app_team_id())))
        OR (current_app_role() = 'sales_rep' AND (owner_id = current_app_user_id() OR owner_id IS NULL))
    )
);

CREATE POLICY rls_deale_modify ON deale
FOR ALL USING (
    -- Controlling i Marketing mają zakaz edycji dealów
    current_app_role() NOT IN ('controlling', 'marketing') AND (
        current_app_role() IN ('super_admin', 'vertriebsleitung')
        OR (current_app_role() = 'team_lead' AND (team_id = current_app_team_id() OR owner_id IN (SELECT id FROM uzytkownicy WHERE team_id = current_app_team_id())))
        OR (current_app_role() = 'sales_rep' AND (owner_id = current_app_user_id() OR owner_id IS NULL))
    )
);

-- ============================================================================
-- 6. POLITYKI DLA TABELI: AKTYWNOŚCI
-- ============================================================================
CREATE POLICY rls_aktywnosci_select ON aktywnosci
FOR SELECT USING (
    current_app_role() IN ('super_admin', 'vertriebsleitung', 'controlling', 'marketing')
    OR (current_app_role() = 'team_lead' AND uzytkownik_id IN (SELECT id FROM uzytkownicy WHERE team_id = current_app_team_id()))
    OR (current_app_role() = 'sales_rep' AND uzytkownik_id = current_app_user_id())
);

CREATE POLICY rls_aktywnosci_modify ON aktywnosci
FOR ALL USING (
    current_app_role() NOT IN ('controlling') AND (
        current_app_role() IN ('super_admin', 'vertriebsleitung')
        OR (current_app_role() = 'team_lead' AND uzytkownik_id IN (SELECT id FROM uzytkownicy WHERE team_id = current_app_team_id()))
        OR (current_app_role() IN ('sales_rep', 'marketing') AND uzytkownik_id = current_app_user_id())
    )
);
