-- ============================================================================
-- DANE TESTOWE (5-10 rekordów dla każdej kolekcji)
-- ============================================================================

-- 1. Role
INSERT INTO role (id, nazwa, uprawnienia) VALUES
(1, 'Admin', '{"all": true, "manage_users": true}'::jsonb),
(2, 'Manager', '{"view_team": true, "edit_team": true}'::jsonb),
(3, 'Handlowiec', '{"view_own": true, "edit_own": true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. Użytkownicy
INSERT INTO uzytkownicy (id, imie, nazwisko, email, haslo_hash, rola_id) VALUES
(1, 'Piotr', 'Wiśniewski', 'piotr.wisniewski@matchpoint.pl', '$2a$12$hash1', 1),
(2, 'Marta', 'Kowalska', 'marta.kowalska@matchpoint.pl', '$2a$12$hash2', 2),
(3, 'Tomasz', 'Zieliński', 'tomasz.zielinski@matchpoint.pl', '$2a$12$hash3', 3),
(4, 'Anna', 'Nowak', 'anna.nowak@matchpoint.pl', '$2a$12$hash4', 3),
(5, 'Krzysztof', 'Wójcik', 'krzysztof.wojcik@matchpoint.pl', '$2a$12$hash5', 3)
ON CONFLICT (id) DO NOTHING;

-- 3. Zespoły (Teams)
INSERT INTO teams (id, nazwa, leader_id) VALUES
(1, 'Enterprise Sales', 2),
(2, 'SME & Mid-Market', 2),
(3, 'Customer Success', 1)
ON CONFLICT (id) DO NOTHING;

-- 4. Firmy
INSERT INTO firmy (id, nazwa, branza, rozmiar, domain, nadrzedna_firma_id, owner_id) VALUES
(1, 'Comarch SA', 'IT & Oprogramowanie', 'Duże', 'comarch.pl', NULL, 3),
(2, 'InPost Tech', 'Logistyka & E-commerce', 'Duże', 'inpost.pl', NULL, 3),
(3, 'Asseco Poland', 'Fintech & Banking', 'Duże', 'asseco.pl', NULL, 4),
(4, 'DocPlanner Group', 'HealthTech', 'Średnie', 'docplanner.com', NULL, 4),
(5, 'Brainly Poland', 'EdTech', 'Średnie', 'brainly.com', NULL, 5),
(6, 'Apptension Sp. z o.o.', 'Software House', 'Małe', 'apptension.com', NULL, 5),
(7, 'Netguru SA', 'Digital Agency', 'Średnie', 'netguru.com', NULL, 3),
(8, 'Verve Retail Labs', 'Retail Tech', 'Mikro', 'ververetail.eu', NULL, 4)
ON CONFLICT (id) DO NOTHING;

-- 5. Kontakty
INSERT INTO kontakty (id, imie, nazwisko, email, telefon, firma_id, owner_id, lifecycle_status, zrodlo, consent) VALUES
(1, 'Michał', 'Borkowski', 'm.borkowski@brainly.com', '+48 601 234 567', 5, 5, 'Klient', 'HubSpot', true),
(2, 'Jan', 'Kowalski', 'j.kowalski@inpost.pl', '+48 502 345 678', 2, 3, 'Klient', 'Manualny', true),
(3, 'Katarzyna', 'Nowicka', 'k.nowicka@docplanner.com', '+48 512 789 012', 4, 4, 'Kontakt', 'HubSpot', true),
(4, 'Grzegorz', 'Wójcik', 'g.wojcik@comarch.pl', '+48 691 890 123', 1, 3, 'Lead', 'Import', false),
(5, 'Aleksandra', 'Dąbrowska', 'a.dabrowska@asseco.pl', '+48 784 567 890', 3, 4, 'Klient', 'HubSpot', true),
(6, 'Łukasz', 'Majewski', 'l.majewski@netguru.com', '+48 600 111 222', 7, 3, 'Kontakt', 'Manualny', true),
(7, 'Ewa', 'Szymańska', 'e.szymanska@apptension.com', '+48 501 333 444', 6, 5, 'Lead', 'HubSpot', true),
(8, 'Mateusz', 'Kaczmarek', 'm.kaczmarek@ververetail.eu', '+48 609 888 777', 8, 4, 'Były Klient', 'Manualny', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Pipelines & Etapy
INSERT INTO pipelines (id, nazwa) VALUES
(1, 'B2B Enterprise Pipeline'),
(2, 'SME Fast-Track')
ON CONFLICT (id) DO NOTHING;

INSERT INTO etapy (id, nazwa, pipeline_id, prawdopodobienstwo, kolejnosc) VALUES
(1, 'Kwalifikacja / Discovery', 1, 20, 1),
(2, 'Analiza Potrzeb & Prezentacja', 1, 40, 2),
(3, 'Oferta Handlowa', 1, 60, 3),
(4, 'Negocjacje & Bezpieczeństwo', 1, 80, 4),
(5, 'Zamknięty Wygrany (Won)', 1, 100, 5),
(6, 'Wstępny Kontakt', 2, 30, 1),
(7, 'Oferta Standardowa', 2, 70, 2),
(8, 'Finalizacja', 2, 100, 3)
ON CONFLICT (id) DO NOTHING;

-- 7. Deale
INSERT INTO deale (id, nazwa, wartosc, waluta, pipeline_id, etap_id, data_zamkniecia, prawdopodobienstwo, owner_id, team_id) VALUES
(1, 'Wdrożenie NocoBase ERP dla InPost', 185000.00, 'PLN', 1, 4, '2026-09-30', 80, 3, 1),
(2, 'Comarch Cloud Automation Engine', 240000.00, 'PLN', 1, 2, '2026-10-15', 40, 3, 1),
(3, 'DocPlanner Telemedicine API Sync', 45000.00, 'EUR', 1, 3, '2026-09-15', 60, 4, 1),
(4, 'Brainly AI Content Classifier', 32000.00, 'USD', 1, 5, '2026-08-10', 100, 5, 2),
(5, 'Asseco Banking Compliance Module', 320000.00, 'PLN', 1, 1, '2026-11-20', 20, 4, 1),
(6, 'Netguru React Native Dev Retainer', 95000.00, 'PLN', 1, 3, '2026-09-01', 60, 3, 2),
(7, 'Apptension AWS Cost Optimizer', 28000.00, 'EUR', 2, 7, '2026-08-28', 70, 5, 2)
ON CONFLICT (id) DO NOTHING;

-- 8. Aktywności
INSERT INTO aktywnosci (id, typ, tresc, data, kontakt_id, deal_id, uzytkownik_id) VALUES
(1, 'Spotkanie', 'Prezentacja architektury PostgreSQL 18 & NocoBase dla zespołu Enterprise', '2026-08-25 10:00:00+02', 2, 1, 3),
(2, 'Telefoniczny', 'Omówienie warunków SLA oraz polityki RLS w bazie produkcyjnej', '2026-08-24 14:30:00+02', 1, 4, 5),
(3, 'Zadanie', 'Przygotowanie oferty cenowej z uwzględnieniem 100 stanowisk handlowych', '2026-08-26 12:00:00+02', 3, 3, 4),
(4, 'Notatka', 'Klient preferuje hosting na serwerze Hostinger VPS z obsługą Docker Compose', '2026-08-23 16:45:00+02', 4, 2, 3),
(5, 'Spotkanie', 'Warsztaty wdrożeniowe: automatyzacja procesów za pomocą NocoBase Workflows', '2026-08-28 09:30:00+02', 5, 5, 4),
(6, 'Zadanie', 'Weryfikacja podpisania zgód RODO oraz umowy powierzenia przetwarzania danych', '2026-08-27 15:00:00+02', 6, 6, 3)
ON CONFLICT (id) DO NOTHING;

-- 9. Powiązania (Verknüpfungen)
INSERT INTO powiazania (id, typ, obiekt1_id, obiekt1_typ, obiekt2_id, obiekt2_typ, rola) VALUES
(1, 'Kontakt-Deal', 2, 'Kontakt', 1, 'Deal', 'Główny Sponsor Projektu'),
(2, 'Kontakt-Deal', 1, 'Kontakt', 4, 'Deal', 'Decydent Techniczny (CTO)'),
(3, 'Kontakt-Firma', 3, 'Kontakt', 4, 'Firma', 'Head of Procurement'),
(4, 'Kontakt-Deal', 5, 'Kontakt', 5, 'Deal', 'Członek Zarządu'),
(5, 'Firma-Deal', 1, 'Firma', 2, 'Deal', 'Klient Główny')
ON CONFLICT (id) DO NOTHING;

-- 10. Właściwości (Eigenschaften)
INSERT INTO wlasciwosci (id, nazwa, typ, kolekcja) VALUES
(1, 'Preferowany Język Komunikacji', 'Select', 'Kontakty'),
(2, 'Budżet Roczny IT', 'Number', 'Firmy'),
(3, 'Poziom Zaawansowania Chmurowego', 'Select', 'Firmy'),
(4, 'Data Ostatniego Audytu Bezpieczeństwa', 'Date', 'Deale'),
(5, 'Wymaga Integracji z ERP', 'Boolean', 'Deale')
ON CONFLICT (id) DO NOTHING;

-- 11. Widoki (Ansichten)
INSERT INTO widoki (id, nazwa, kolekcja, filtry, kolumny, sortowanie, publiczny, uzytkownik_id) VALUES
(1, 'Wszystkie Aktywne Deale Q3', 'Deale', '{"etap_id": {"$ne": 5}}'::jsonb, '["nazwa", "wartosc", "etap_id", "data_zamkniecia"]'::jsonb, '[{"field": "wartosc", "order": "desc"}]'::jsonb, true, 1),
(2, 'Moje Kluczowe Kontakty', 'Kontakty', '{"lifecycle_status": "Klient"}'::jsonb, '["imie", "nazwisko", "email", "telefon", "firma_id"]'::jsonb, '[{"field": "nazwisko", "order": "asc"}]'::jsonb, false, 3),
(3, 'Pipeline Enterprise Kanban', 'Deale', '{"pipeline_id": 1}'::jsonb, '["nazwa", "wartosc", "owner_id", "etap_id"]'::jsonb, '[{"field": "kolejnosc", "order": "asc"}]'::jsonb, true, 2)
ON CONFLICT (id) DO NOTHING;

-- 12. Audit Log (Przykładowe wpisy)
INSERT INTO audit_log (id, akcja, kolekcja, obiekt_id, uzytkownik_id, stare_dane, nowe_dane) VALUES
(1, 'CREATE', 'deale', 1, 3, NULL, '{"nazwa": "Wdrożenie NocoBase ERP dla InPost", "wartosc": 185000}'::jsonb),
(2, 'UPDATE', 'deale', 1, 3, '{"etap_id": 3, "prawdopodobienstwo": 60}'::jsonb, '{"etap_id": 4, "prawdopodobienstwo": 80}'::jsonb),
(3, 'CREATE', 'kontakty', 1, 5, NULL, '{"imie": "Michał", "nazwisko": "Borkowski", "email": "m.borkowski@brainly.com"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
