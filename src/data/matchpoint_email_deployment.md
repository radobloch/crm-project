# Instrukcja Wdrożenia Integracji E-mail (SMTP/IMAP/S3/BullMQ) dla NocoBase (Matchpoint CRM)

Niniejszy przewodnik opisuje krok po kroku konfigurację i integrację poczty elektronicznej (Phase 2 CRM) na serwerze Hostinger VPS.

---

## 1. Architektura Rozwiązania

```
   [ Użytkownik CRM ] 
          │  (Przycisk "Wyślij E-mail" na karcie Kontaktu/Dealu)
          ▼
   [ NocoBase UI / API ] ──► [ Redis & BullMQ Queue ] ──► [ Worker SMTP (Hostinger) ] ──► [ Odbiorca ]
                                       │                                 │
                                       ▼                                 ▼
                         [ Magazyn Załączników S3 ]          [ NocoBase Aktywności ]
                                                                 (Protokół WYSŁANY)

   [ Skrzynka IMAP ] ──────► [ IMAP Sync Cron ] ────────────► [ NocoBase Aktywności ]
 (np. crm@matchpoint-crm.pl)  (Dopasowanie do Kontaktu po email) (Protokół ODEBRANY)
```

---

## 2. Konfiguracja Docker Compose z Redis (dla BullMQ)

W pliku `docker-compose.yml` na serwerze Hostinger dodaj usługę `redis` wymaganą do kolejkowania e-maili i asynchronicznych zadań:

```yaml
services:
  # ... istniejące usługi: postgres, nocobase ...

  redis:
    image: redis:7-alpine
    container_name: matchpoint_redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-SecretRedisPass2026!}
    volumes:
      - redis_data:/data
    networks:
      - matchpoint_net

volumes:
  pgdata:
    driver: local
  nocobase_storage:
    driver: local
  redis_data:
    driver: local
```

---

## 3. Konfiguracja Wtyczki E-mail w NocoBase

1. Zaloguj się jako **Super Admin** w NocoBase.
2. Przejdź do **Plugin Manager** i upewnij się, że włączone są wtyczki:
   - `@nocobase/plugin-email`
   - `@nocobase/plugin-workflow` (do automatyzacji wysyłki np. po zmianie etapu deala)
   - `@nocobase/plugin-file-manager` (magazyn załączników S3)
3. W sekcji **Settings -> Email Configuration**:
   - **SMTP Host**: `smtp.hostinger.com`
   - **Port**: `465` (SSL/TLS)
   - **Username**: `crm@matchpoint-crm.pl`
   - **Password**: Hasło ze skrzynki Hostinger
   - **Default From**: `Matchpoint CRM <crm@matchpoint-crm.pl>`
4. W sekcji **File Storage**:
   - Dodaj storage typu **S3 / Wasabi / MinIO**
   - Podaj dane dostępowe (Bucket, Access Key, Secret Key).

---

## 4. Dodanie Akcji "Wyślij E-mail" na Karcie Kontaktu i Dealu

1. Przejdź do widoku **Kontakty** lub **Deale**.
2. W widoku szczegółów rekordu (Record Detail Block) kliknij **Configure Actions -> Add Action -> Trigger Workflow / Send Email**.
3. Jako formularz modalny wybierz:
   - Pole wyboru szablonu (np. *Przesłanie Oferty Handlowej*, *Follow-up*).
   - Dynamiczne podstawianie danych: `{{kontakt.email}}`, `{{kontakt.imie}}`, `{{deal.wartosc}}`.
   - Pole załącznika (Upload do S3).
4. Po zatwierdzeniu formularza silnik NocoBase:
   - Przesyła zadanie do kolejki **BullMQ**.
   - Tworzy wpis w tabeli **`aktywnosci`** z typem `E-mail` i treścią wiadomości powiązaną z `kontakt_id` i `deal_id`.

---

## 5. Synchronizacja Przychodząca IMAP (Inbound Sync)

Skrypt `src/scripts/email_service.ts` uruchamiany w tle (np. przez PM2 lub kontener Cron):
- Odpytuje skrzynkę IMAP co 5 minut.
- Parsuje nagłówek `From`.
- Wyszukuje rekord w tabeli `kontakty` dopasowany do adresu e-mail nadawcy.
- Jeśli kontakt istnieje, automatycznie rejestruje aktywność i przypisuje do opiekuna kontaktu (`owner_id`).
- W przypadku braku kontaktu, rejestruje aktywność ogólną w systemie.
