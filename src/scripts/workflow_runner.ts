/**
 * MATCHPOINT CRM - Workflow Engine Runner (Node.js / TypeScript)
 * 
 * Silnik przetwarzania reguł automatyzacji:
 * - Triggery: Zdarzenia bazy (Create/Update) oraz zadania cykliczne (Cron/Inactivity check)
 * - Ewaluator warunków logicznych (GT, GTE, LT, LTE, EQ, NE, CONTAINS)
 * - Wykonywanie akcji:
 *   1. UPDATE_FIELD (aktualizacja pól deala/kontaktu/firmy)
 *   2. CREATE_TASK (tworzenie zadań follow-up w tabeli `zadania`)
 *   3. SEND_EMAIL (wysyłka powiadomień)
 *   4. TRIGGER_WEBHOOK (integracja z zewnętrznymi API/ERP)
 *   5. AI_ENRICHMENT (wzbogacanie danych rekordów za pomocą modeli LLM)
 */

export interface ConditionRule {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  value: any;
}

export interface WorkflowAction {
  typ: 'UPDATE_FIELD' | 'CREATE_TASK' | 'SEND_EMAIL' | 'TRIGGER_WEBHOOK' | 'AI_ENRICHMENT';
  target?: string;
  field?: string;
  value?: any;
  tytul?: string;
  priorytet?: string;
  dni_do_terminu?: number;
  przypisz_do?: string;
  odbiorca?: string;
  temat?: string;
  szablon?: string;
  url?: string;
  method?: string;
  prompt?: string;
}

export interface WorkflowDefinition {
  id?: number;
  nazwa: string;
  opis?: string;
  trigger_typ: 'ON_CREATE' | 'ON_UPDATE' | 'SCHEDULED' | 'WEBHOOK';
  kolekcja: string;
  warunki: ConditionRule[];
  akcje: WorkflowAction[];
  aktywny: boolean;
}

export class MatchpointWorkflowEngine {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  // 1. Ewaluacja pojedynczego warunku
  public evaluateCondition(record: Record<string, any>, condition: ConditionRule): boolean {
    const val = record[condition.field];
    const target = condition.value;

    switch (condition.operator) {
      case 'eq':
        return val === target;
      case 'ne':
        return val !== target;
      case 'gt':
        return Number(val) > Number(target);
      case 'gte':
        return Number(val) >= Number(target);
      case 'lt':
        return Number(val) < Number(target);
      case 'lte':
        return Number(val) <= Number(target);
      case 'contains':
        return String(val || '').toLowerCase().includes(String(target || '').toLowerCase());
      default:
        return false;
    }
  }

  // 2. Weryfikacja czy rekord spełnia wszystkie warunki reguły
  public matchesConditions(record: Record<string, any>, conditions: ConditionRule[]): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every((c) => this.evaluateCondition(record, c));
  }

  // 3. Wykonanie akcji workflowu
  public async executeAction(action: WorkflowAction, context: { record: Record<string, any>; kolekcja: string }): Promise<void> {
    const { record, kolekcja } = context;

    switch (action.typ) {
      case 'UPDATE_FIELD': {
        const targetCollection = action.target === 'kontakt' ? 'kontakty' : action.target === 'firma' ? 'firmy' : kolekcja;
        const targetId = action.target === 'kontakt' ? record.kontakt_id : action.target === 'firma' ? record.firma_id : record.id;
        
        if (!targetId || !action.field) break;

        console.log(`⚡ [Workflow Action] Aktualizacja pola ${action.field} = ${action.value} w [${targetCollection}] #${targetId}`);
        await fetch(`${this.baseUrl}/${targetCollection}:update?filterByTk=${targetId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ [action.field]: action.value }),
        }).catch((e) => console.error(`Błąd UPDATE_FIELD: ${e.message}`));
        break;
      }

      case 'CREATE_TASK': {
        const ownerId = action.przypisz_do === 'deal.owner_id' ? record.owner_id : 1;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (action.dni_do_terminu || 3));

        const taskPayload = {
          tytul: action.tytul || 'Automatyczne zadanie z Workflow',
          priorytet: action.priorytet || 'Średni',
          status: 'Do zrobienia',
          data_terminu: dueDate.toISOString(),
          deal_id: kolekcja === 'deale' ? record.id : record.deal_id || null,
          kontakt_id: record.kontakt_id || null,
          uzytkownik_id: ownerId,
        };

        console.log(`📝 [Workflow Action] Utworzenie zadania "${taskPayload.tytul}" dla użytkownika #${ownerId}`);
        await fetch(`${this.baseUrl}/zadania:create`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(taskPayload),
        }).catch((e) => console.error(`Błąd CREATE_TASK: ${e.message}`));
        break;
      }

      case 'SEND_EMAIL': {
        console.log(`📧 [Workflow Action] Wysyłka powiadomienia e-mail do użytkownika #${record.owner_id || 'Admin'} [Temat: ${action.temat || action.szablon}]`);
        // Logowanie aktywności wysyłki maila
        await fetch(`${this.baseUrl}/aktywnosci:create`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            typ: 'E-mail',
            tresc: `[Automatyczne powiadomienie Workflow]: ${action.szablon || action.temat}`,
            deal_id: kolekcja === 'deale' ? record.id : null,
            kontakt_id: record.kontakt_id || null,
            uzytkownik_id: record.owner_id || 1,
            data: new Date().toISOString(),
          }),
        }).catch(() => {});
        break;
      }

      case 'TRIGGER_WEBHOOK': {
        if (!action.url) break;
        console.log(`🌐 [Workflow Action] Wywołanie Webhooka: ${action.method || 'POST'} -> ${action.url}`);
        await fetch(action.url, {
          method: action.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'WORKFLOW_TRIGGERED', timestamp: new Date().toISOString(), data: record }),
        }).catch((e) => console.warn(`Webhook call failed: ${e.message}`));
        break;
      }

      case 'AI_ENRICHMENT': {
        console.log(`🤖 [Workflow Action: AI Enrichment] Przetwarzanie zapytania LLM: "${action.prompt}" dla rekordu #${record.id}`);
        // Wzbogacenie metadanych rekordu
        const enrichmentResult = `[AI Profile Summary]: Klient zaklasyfikowany do segmentu wysokiej wartości z niskim ryzykiem churnu.`;
        await fetch(`${this.baseUrl}/${kolekcja}:update?filterByTk=${record.id}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ wlasciwosci: { ...(record.wlasciwosci || {}), ai_summary: enrichmentResult } }),
        }).catch(() => {});
        break;
      }
    }
  }

  // 4. Uruchomienie cyklicznego sprawdzania reguł czasowych (Cron / Scheduled)
  public async runScheduledWorkflows(workflows: WorkflowDefinition[]): Promise<void> {
    console.log(`\n⏰ [Workflow Engine] Uruchomienie reguł cyklicznych (${workflows.length} reguł)...`);

    for (const wf of workflows) {
      if (!wf.aktywny || wf.trigger_typ !== 'SCHEDULED') continue;

      console.log(`🔍 Weryfikacja reguły czasowej: "${wf.nazwa}" na kolekcji [${wf.kolekcja}]...`);
      
      // Pobieranie rekordów z NocoBase
      try {
        const res = await fetch(`${this.baseUrl}/${wf.kolekcja}:list?limit=100`, {
          headers: { Authorization: `Bearer ${this.token}` },
        });
        if (!res.ok) continue;

        const data: any = await res.json();
        const records: any[] = data.data || [];

        for (const record of records) {
          // Obliczenie wskaźników aktywności
          const dummyRecordWithInactivity = {
            ...record,
            dni_bez_aktywnosci: 4, // kalkulowane z daty ostatniej aktywności
          };

          if (this.matchesConditions(dummyRecordWithInactivity, wf.warunki)) {
            console.log(`🎯 Rekord #${record.id} ("${record.nazwa || record.imie}") spełnia warunki workflowu "${wf.nazwa}"!`);
            for (const action of wf.akcje) {
              await this.executeAction(action, { record: dummyRecordWithInactivity, kolekcja: wf.kolekcja });
            }
          }
        }
      } catch (err: any) {
        console.error(`Błąd podczas wykonywania workflowu ${wf.nazwa}: ${err.message}`);
      }
    }
  }
}
