# PLAN MIGRACJI: HUBSPOT -> NOCOBASE (MATCHPOINT CRM)

## 1. Zespół Projektowy i Odpowiedzialności
- **Lead Migracji / Architekt IT (Piotr W.)**: Nadzór nad skryptami ETL, weryfikacja schematu NocoBase, walidacja integralności bazy danych PostgreSQL 18.
- **Head of Sales (Marta K.)**: Mapowanie etapów pipeline'u, weryfikacja poprawności przypisania dealów i właścicieli (owners).
- **Inżynier DevOps / Sysadmin**: Zarządzanie kopiami zapasowymi, monitoring limitów API, konfiguracja NocoBase na serwerze Hostinger VPS.
- **Key Users (3 Handlowców)**: Testy akceptacyjne UAT w trybie Dry-Run.

---

## 2. Harmonogram Cutover (Go-Live Weekend)

| Faza | Dzień / Godzina | Zadanie | Wykonawca | Status / Rezultat |
|------|-----------------|---------|-----------|-------------------|
| **T-14 dni** | Poniedziałek | Audyt pól niestandardowych w HubSpot & utworzenie schematu w NocoBase | Architekt IT | Schemat JSON gotowy |
| **T-7 dni** | Piątek 18:00 | **Dry-Run 1**: Pełna ekstrakcja i import testowy do stagingu NocoBase | Architekt IT | Raport błędów & korekta mapowań |
| **T-2 dni** | Środa 14:00 | **UAT**: Weryfikacja danych przez Head of Sales i liderów zespołów | Head of Sales | Akceptacja i sign-off |
| **T-0 (Cutover)** | **Piątek 19:00** | **Blokada edycji w HubSpot** (Przełączenie użytkowników w tryb Read-Only) | Sysadmin | Brak nowych zmian w HubSpot |
| **T-0** | Piątek 19:30 | **Ekstrakcja Pełna / Delta**: Uruchomienie `hubspot_migration.ts` z tokenem Private App | Architekt IT | Import Kontaktów, Firm, Dealów |
| **T-0** | Piątek 23:00 | Import powiązań M:N (`powiazania`) oraz historii aktywności | Architekt IT | 100% spójności relacji |
| **T+1 dzień** | Sobota 10:00 | Weryfikacja automatycznych triggerów, indeksów `pg_trgm` oraz polityk RLS | Architekt IT | Baza zwalidowana |
| **T+1 dzień** | Sobota 14:00 | Wygenerowanie zaproszeń i wymuszenie 2FA dla 50 handlowców | Sysadmin | Konta aktywne |
| **T+2 dni** | Niedziela 18:00 | Ostateczny test działania interfejsu (Table Views, Kanban, Dashboard) | Head of Sales | Gotowość do startu |
| **T+3 dni** | **Poniedziałek 08:00** | **GO-LIVE**: Zespół handlowy rozpoczyna pracę wyłącznie w NocoBase | Wszyscy | Start produkcyjny |

---

## 3. Strategia Rückfallnetz (Siatka Bezpieczeństwa - 90 Dni)
1. **Tryb Read-Only HubSpot**:
   - Dostęp do konta HubSpot zostaje zachowany przez okres **90 dni** po dacie Cutover.
   - Wszyscy użytkownicy mają odebrane uprawnienia do tworzenia i edycji danych (`Write -> View Only`).
2. **Archiwum Snapshot**:
   - Wykonanie pełnego eksportu HubSpot Bulk Export (pliki CSV/JSON) i zapisanie w bezpiecznym repozytorium S3/Storage z sumami kontrolnymi SHA-256.
3. **Procedura Awaryjna (Rollback Plan)**:
   - W przypadku krytycznej awarii infrastruktury przed poniedziałkiem 08:00, baza NocoBase zostaje zresetowana, a dostęp edycyjny w HubSpot przywrócony w ciągu 30 minut.
