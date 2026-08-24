# Instrukcja Wdrożenia n8n & Automatyzacji Kampanii i Zadań dla Matchpoint CRM (Phase 2)

Niniejsza instrukcja krok po kroku wyjaśnia, jak uruchomić **n8n** na serwerze Hostinger VPS, podłączyć go do **NocoBase** przez REST API i Webhooki oraz wdrożyć automatyczne sekwencje zadań.

---

## 1. Uruchomienie n8n w `docker-compose.yml`

Dodaj kontener `n8n` do pliku `docker-compose.yml` w tej samej sieci Docker co `matchpoint_nocobase`:

```yaml
services:
  # ... istniejące: postgres, nocobase, redis ...

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    container_name: matchpoint_n8n
    restart: unless-stopped
    ports:
      - "127.0.0.1:5678:5678"
    environment:
      - N8N_HOST=n8n.matchpoint-crm.pl
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - WEBHOOK_URL=https://n8n.matchpoint-crm.pl/
      - GENERIC_TIMEZONE=Europe/Warsaw
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - matchpoint_net

volumes:
  pgdata:
    driver: local
  nocobase_storage:
    driver: local
  redis_data:
    driver: local
  n8n_data:
    driver: local
```

---

## 2. Podłączenie n8n do NocoBase (Autoryzacja API)

1. W **NocoBase**:
   - Przejdź do **Users & Permissions -> API Keys** i wygeneruj token dla użytkownika systemowego (np. `n8n-automation-bot`).
2. W **n8n**:
   - Otwórz panel `https://n8n.matchpoint-crm.pl`.
   - Przejdź do **Credentials -> New Credential -> Header Auth**.
   - Nazwij poświadczenie: `NocoBase API Token`.
   - Header Name: `Authorization`
   - Header Value: `Bearer <TWOJ_TOKEN_NOCOBASE>`.

---

## 3. Import Gotowych Przepływów (Workflows)

1. W panelu n8n kliknij **Workflows -> Import from File** i wskaż plik `/src/data/matchpoint_n8n_workflows.json`.
2. Zostaną zaimportowane dwa główne scenariusze:
   - **Harmonogram Kampanii**: Co 15 minut sprawdza tabelę `kampanie` pod kątem statusu `Zaplanowana` i `data_wysylki <= NOW()`, pobiera odbiorców z tabeli `kontakty`, wysyła maile przez SMTP i rejestruje wpis w `aktywnosci`.
   - **Automatyczny Follow-up (Sekwencja Zadań)**: Webhook reagujący na przejście Dealu do etapu *Oferta / Negocjacje*, który automatycznie tworzy zadanie w tabeli `zadania` z terminem za 3 dni dla opiekuna (`owner_id`).

---

## 4. Konfiguracja Webhooka w NocoBase (Trigger Zmiany Etapu)

1. W NocoBase przejdź do wtyczki **Workflows**.
2. Utwórz nowy workflow:
   - **Trigger**: `Collection event -> deale -> After record updated`.
   - **Condition**: `{{ $record.etap_id }} == 4` (Etap: Złożona Oferta).
   - **Action**: `HTTP Request -> POST https://n8n.matchpoint-crm.pl/webhook/nocobase-deal-stage-change`.
   - **Body**:
     ```json
     {
       "deal_id": "{{ $record.id }}",
       "deal_nazwa": "{{ $record.nazwa }}",
       "kontakt_id": "{{ $record.kontakt_id }}",
       "owner_id": "{{ $record.owner_id }}"
     }
     ```

---

## 5. Konfiguracja Widoków w NocoBase

W interfejsie użytkownika CRM:
- **Kalendarz Zadań**: Dodaj blok typu **Calendar** podpięty pod kolekcję `zadania` z polem początkowym `data_terminu` oraz kodowaniem kolorystycznym według pola `priorytet` (Czerwony: Wysoki, Żółty: Średni, Niebieski: Niski).
- **Zarządzanie Kampaniami**: Dodaj blok **Table** podpięty pod `kampanie` z kolumnami: *Nazwa, Temat, Status, Termin Wysyłki, Liczba Odbiorców, Wysłane, Otwarcia, Kliknięcia*.
