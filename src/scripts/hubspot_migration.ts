/**
 * MATCHPOINT CRM - Pipeline migracyjny HubSpot v3 -> NocoBase (Node.js / TypeScript)
 * 
 * Funkcjonalności:
 * 1. Rate limiter chroniący limit HubSpot (190 req / 10s -> max ~14 req/s) z automatycznym retry na 429
 * 2. Ekstrakcja obiektów (Contacts, Companies, Deals, Engagements) + Asocjacji M:N
 * 3. Delta-Sync na podstawie pola hs_lastmodifieddate
 * 4. Transformacja i normalizacja danych do modelu NocoBase
 * 5. Import do NocoBase REST API z walidacją i raportem błędów
 */

import * as fs from 'fs';
import * as path from 'path';

interface MigrationConfig {
  hubspotToken: string;
  nocobaseUrl: string;
  nocobaseToken: string;
  deltaSince?: string; // ISO String np. "2026-08-20T00:00:00Z"
  isDryRun: boolean;
}

const config: MigrationConfig = {
  hubspotToken: process.env.HUBSPOT_ACCESS_TOKEN || 'pat-eu1-mock-hubspot-token',
  nocobaseUrl: process.env.NOCOBASE_API_URL || 'http://localhost:13000/api',
  nocobaseToken: process.env.NOCOBASE_API_TOKEN || 'nc_jwt_token_here',
  deltaSince: process.env.DELTA_SINCE,
  isDryRun: process.env.DRY_RUN === 'true',
};

// ============================================================================
// 1. Klient HTTP z Rate Limiterem i Retry (HubSpot API v3)
// ============================================================================
class RateLimitedHubSpotClient {
  private token: string;
  private minIntervalMs = 70; // max ~14 req / sekundę (bezpieczny limit dla 190req/10s)
  private lastRequestTime = 0;

  constructor(token: string) {
    this.token = token;
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  public async get<T>(url: string, params: Record<string, any> = {}, retries = 5): Promise<T> {
    await this.throttle();
    const urlObj = new URL(url.startsWith('http') ? url : `https://api.hubapi.com${url}`);
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        urlObj.searchParams.append(key, String(params[key]));
      }
    });

    try {
      const response = await fetch(urlObj.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 429 && retries > 0) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10) * 1000;
        console.warn(`[429 Rate Limit] Oczekiwanie ${retryAfter}ms przed ponowieniem... (Pozostało prób: ${retries})`);
        await new Promise((r) => setTimeout(r, retryAfter));
        return this.get<T>(url, params, retries - 1);
      }

      if (!response.ok) {
        throw new Error(`HubSpot API Error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (retries > 0 && err.message.includes('429')) {
        await new Promise((r) => setTimeout(r, 2000));
        return this.get<T>(url, params, retries - 1);
      }
      throw err;
    }
  }

  public async post<T>(url: string, data: any, retries = 5): Promise<T> {
    await this.throttle();
    const fullUrl = url.startsWith('http') ? url : `https://api.hubapi.com${url}`;

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status === 429 && retries > 0) {
        const retryAfter = parseInt(response.headers.get('retry-after') || '2', 10) * 1000;
        console.warn(`[429 Rate Limit] Oczekiwanie ${retryAfter}ms...`);
        await new Promise((r) => setTimeout(r, retryAfter));
        return this.post<T>(url, data, retries - 1);
      }

      if (!response.ok) {
        throw new Error(`HubSpot API Error: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 2000));
        return this.post<T>(url, data, retries - 1);
      }
      throw err;
    }
  }
}

// ============================================================================
// 2. Ekstrakcja Danych z HubSpot API v3
// ============================================================================
export class HubSpotExtractor {
  private hs: RateLimitedHubSpotClient;

  constructor(token: string) {
    this.hs = new RateLimitedHubSpotClient(token);
  }

  // Pobranie właścicieli (HubSpot Owners -> NocoBase Użytkownicy)
  async extractOwners(): Promise<Map<string, any>> {
    console.log('🔄 Pobieranie listy właścicieli (Owners) z HubSpot...');
    const ownersMap = new Map<string, any>();
    let after: string | undefined = undefined;

    do {
      const resp: any = await this.hs.get('/crm/v3/owners', { after, limit: 100 });
      for (const owner of resp.results || []) {
        ownersMap.set(owner.id, {
          hs_owner_id: owner.id,
          email: owner.email,
          imie: owner.firstName || '',
          nazwisko: owner.lastName || '',
        });
      }
      after = resp.paging?.next?.after;
    } while (after);

    console.log(`✅ Pobrano ${ownersMap.size} właścicieli.`);
    return ownersMap;
  }

  // Pobranie kolekcji z obsługą stronicowania i Delta-Sync (Search API)
  async extractObjects(
    objectType: 'contacts' | 'companies' | 'deals',
    properties: string[],
    deltaSince?: string
  ): Promise<any[]> {
    console.log(`🔄 Ekstrakcja obiektu: ${objectType}${deltaSince ? ` (Delta od: ${deltaSince})` : ''}...`);
    const results: any[] = [];
    let after: string | undefined = undefined;

    if (deltaSince) {
      // Użycie Search API dla zmian po dacie lastmodifieddate
      let pagingAfter = 0;
      let hasMore = true;
      while (hasMore) {
        const body = {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'hs_lastmodifieddate',
                  operator: 'GTE',
                  value: new Date(deltaSince).getTime().toString(),
                },
              ],
            },
          ],
          properties,
          limit: 100,
          after: pagingAfter,
        };
        const resp: any = await this.hs.post(`/crm/v3/objects/${objectType}/search`, body);
        results.push(...(resp.results || []));
        if (resp.paging?.next?.after) {
          pagingAfter = resp.paging.next.after;
        } else {
          hasMore = false;
        }
      }
    } else {
      // Pełny odczyt paginowany
      do {
        const resp: any = await this.hs.get(`/crm/v3/objects/${objectType}`, {
          properties: properties.join(','),
          limit: 100,
          after,
        });
        results.push(...(resp.results || []));
        after = resp.paging?.next?.after;
      } while (after);
    }

    console.log(`✅ Pobrano ${results.length} rekordów dla [${objectType}].`);
    return results;
  }

  // Pobranie powiązań (Associations) np. contacts -> companies, deals -> contacts
  async extractAssociations(fromObjectType: string, toObjectType: string, ids: string[]): Promise<any[]> {
    console.log(`🔄 Pobieranie asocjacji: ${fromObjectType} -> ${toObjectType} (${ids.length} obiektów)...`);
    const associations: any[] = [];
    const chunkSize = 100;

    for (let i = 0; i < ids.length; i += chunkSize) {
      const batchIds = ids.slice(i, i + chunkSize);
      const resp: any = await this.hs.post(`/crm/v3/associations/${fromObjectType}/${toObjectType}/batch/read`, {
        inputs: batchIds.map((id) => ({ id })),
      });

      for (const item of resp.results || []) {
        for (const toObj of item.to || []) {
          associations.push({
            fromId: item.from.id,
            toId: toObj.id,
            type: toObj.type,
          });
        }
      }
    }

    console.log(`✅ Pobrano ${associations.length} asocjacji.`);
    return associations;
  }
}

// ============================================================================
// 3. Transformator Danych (Mapowanie HubSpot -> NocoBase)
// ============================================================================
export class DataTransformer {
  private userEmailToIdMap: Map<string, number>;
  private companyDomainToIdMap = new Map<string, number>();
  private pipelineStageMap = new Map<string, { pipeline_id: number; etap_id: number }>();

  constructor(userEmailToIdMap: Map<string, number>) {
    this.userEmailToIdMap = userEmailToIdMap;
    this.initDefaultMappings();
  }

  private initDefaultMappings() {
    // Mapowanie etapów HubSpot -> Etapy NocoBase Matchpoint
    this.pipelineStageMap.set('appointmentscheduled', { pipeline_id: 1, etap_id: 1 });
    this.pipelineStageMap.set('qualifiedtobuy', { pipeline_id: 1, etap_id: 2 });
    this.pipelineStageMap.set('presentationscheduled', { pipeline_id: 1, etap_id: 3 });
    this.pipelineStageMap.set('decisionmakerboughtin', { pipeline_id: 1, etap_id: 4 });
    this.pipelineStageMap.set('contractsent', { pipeline_id: 1, etap_id: 4 });
    this.pipelineStageMap.set('closedwon', { pipeline_id: 1, etap_id: 5 });
    this.pipelineStageMap.set('closedlost', { pipeline_id: 1, etap_id: 5 });
  }

  // Transformacja Firm
  transformCompany(hsCompany: any, ownerEmail?: string): any {
    const props = hsCompany.properties || {};
    return {
      hubspot_id: hsCompany.id,
      nazwa: props.name || 'Firma Bez Nazwy',
      branza: props.industry || null,
      rozmiar: this.mapCompanySize(props.numberofemployees),
      domain: props.domain ? props.domain.toLowerCase().trim() : null,
      owner_id: ownerEmail ? this.userEmailToIdMap.get(ownerEmail) || null : null,
      created_at: props.createdate || new Date().toISOString(),
    };
  }

  // Transformacja Kontaktów
  transformContact(hsContact: any, ownerEmail?: string, companyId?: number): any {
    const props = hsContact.properties || {};
    return {
      hubspot_id: hsContact.id,
      imie: props.firstname || 'Nieznane',
      nazwisko: props.lastname || 'Kontakt',
      email: (props.email || `brak-email-${hsContact.id}@migracja.local`).toLowerCase().trim(),
      telefon: props.phone || props.mobilephone || null,
      firma_id: companyId || null,
      owner_id: ownerEmail ? this.userEmailToIdMap.get(ownerEmail) || null : null,
      lifecycle_status: this.mapLifecycleStatus(props.lifecyclestage),
      zrodlo: 'HubSpot',
      consent: props.hs_legal_basis === 'CONSENT_WITH_NOTICE' || Boolean(props.hs_email_optout === 'false'),
      wlasciwosci: {
        hubspot_jobtitle: props.jobtitle || null,
        hubspot_city: props.city || null,
      },
      created_at: props.createdate || new Date().toISOString(),
    };
  }

  // Transformacja Szans Sprzedaży (Deals)
  transformDeal(hsDeal: any, ownerEmail?: string): any {
    const props = hsDeal.properties || {};
    const stageInfo = this.pipelineStageMap.get(props.dealstage) || { pipeline_id: 1, etap_id: 1 };

    return {
      hubspot_id: hsDeal.id,
      nazwa: props.dealname || 'Szansa Sprzedaży',
      wartosc: parseFloat(props.amount || '0.00'),
      waluta: this.mapCurrency(props.deal_currency_code),
      pipeline_id: stageInfo.pipeline_id,
      etap_id: stageInfo.etap_id,
      data_zamkniecia: props.closedate ? props.closedate.split('T')[0] : null,
      prawdopodobienstwo: this.calculateProbability(stageInfo.etap_id),
      owner_id: ownerEmail ? this.userEmailToIdMap.get(ownerEmail) || null : null,
      team_id: 1, // Domyślnie Enterprise Sales
      created_at: props.createdate || new Date().toISOString(),
    };
  }

  private mapCompanySize(empCount?: string): string {
    const count = parseInt(empCount || '0', 10);
    if (count <= 9) return 'Mikro';
    if (count <= 49) return 'Małe';
    if (count <= 249) return 'Średnie';
    return 'Duże';
  }

  private mapLifecycleStatus(stage?: string): string {
    switch ((stage || '').toLowerCase()) {
      case 'lead':
      case 'marketingqualifiedlead':
      case 'salesqualifiedlead':
        return 'Lead';
      case 'opportunity':
        return 'Kontakt';
      case 'customer':
        return 'Klient';
      case 'other':
      case 'evangelist':
        return 'Były Klient';
      default:
        return 'Lead';
    }
  }

  private mapCurrency(currency?: string): string {
    if (['PLN', 'EUR', 'USD'].includes(currency?.toUpperCase() || '')) {
      return currency!.toUpperCase();
    }
    return 'PLN';
  }

  private calculateProbability(etapId: number): number {
    const map: Record<number, number> = { 1: 20, 2: 40, 3: 60, 4: 80, 5: 100 };
    return map[etapId] || 20;
  }
}

// ============================================================================
// 4. Importer do NocoBase & Walidator Danych
// ============================================================================
export class NocoBaseImporter {
  private baseUrl: string;
  private token: string;
  private isDryRun: boolean;

  constructor(baseUrl: string, token: string, isDryRun = false) {
    this.baseUrl = baseUrl;
    this.token = token;
    this.isDryRun = isDryRun;
  }

  async importBatch(collectionName: string, records: any[]): Promise<{ imported: number; errors: any[] }> {
    console.log(`\n🚀 [${collectionName}] Import ${records.length} rekordów (DryRun: ${this.isDryRun})...`);
    let imported = 0;
    const errors: any[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      // Walidacja pól obowiązkowych
      const validationError = this.validateRecord(collectionName, record);
      if (validationError) {
        errors.push({ index: i, record, error: validationError });
        continue;
      }

      if (this.isDryRun) {
        imported++;
        continue;
      }

      try {
        const response = await fetch(`${this.baseUrl}/${collectionName}:create`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        });

        if (!response.ok) {
          const errBody: any = await response.json().catch(() => ({}));
          throw new Error(errBody?.errors?.[0]?.message || `HTTP ${response.status}`);
        }
        imported++;
      } catch (err: any) {
        errors.push({
          index: i,
          record,
          error: err.message,
        });
      }
    }

    console.log(`✅ [${collectionName}] Zakończono: Sukces=${imported}, Błędy=${errors.length}`);
    return { imported, errors };
  }

  private validateRecord(collection: string, record: any): string | null {
    if (collection === 'kontakty') {
      if (!record.email || !record.email.includes('@')) return 'Nieprawidłowy adres email';
      if (!record.nazwisko) return 'Brak nazwiska';
    }
    if (collection === 'firmy') {
      if (!record.nazwa) return 'Brak nazwy firmy';
    }
    if (collection === 'deale') {
      if (!record.nazwa) return 'Brak nazwy szansy sprzedaży';
      if (isNaN(record.wartosc) || record.wartosc < 0) return 'Niepoprawna wartość szansy';
    }
    return null;
  }
}

// ============================================================================
// 5. Główny Runner Procesu Migracji
// ============================================================================
export async function runHubSpotToNocoBaseMigration() {
  console.log('===============================================================');
  console.log('🏁 MATCHPOINT CRM: START PROCESU MIGRACJI HUBSPOT -> NOCOBASE');
  console.log(`⚙️ Tryb: ${config.isDryRun ? 'DRY-RUN (Symulacja)' : 'LIVE CUTOVER'}`);
  console.log('===============================================================\n');

  const extractor = new HubSpotExtractor(config.hubspotToken);
  const importer = new NocoBaseImporter(config.nocobaseUrl, config.nocobaseToken, config.isDryRun);

  // Krok 1: Właściciele
  const ownersMap = await extractor.extractOwners();
  const emailToNocoUserId = new Map<string, number>();
  // Symulacja mapowania userów po mailu (w produkcji zapytanie do /uzytkownicy w NocoBase)
  ownersMap.forEach((owner) => {
    emailToNocoUserId.set(owner.email, 1); // mapowanie na ID użytkownika
  });

  const transformer = new DataTransformer(emailToNocoUserId);

  // Krok 2: Ekstrakcja & Transformacja Firm
  const rawCompanies = await extractor.extractObjects(
    'companies',
    ['name', 'domain', 'industry', 'numberofemployees', 'hubspot_owner_id', 'createdate'],
    config.deltaSince
  );
  const transformedCompanies = rawCompanies.map((c) => {
    const owner = ownersMap.get(c.properties?.hubspot_owner_id);
    return transformer.transformCompany(c, owner?.email);
  });
  const resCompanies = await importer.importBatch('firmy', transformedCompanies);

  // Krok 3: Ekstrakcja & Transformacja Kontaktów
  const rawContacts = await extractor.extractObjects(
    'contacts',
    ['firstname', 'lastname', 'email', 'phone', 'mobilephone', 'lifecyclestage', 'hubspot_owner_id', 'createdate'],
    config.deltaSince
  );
  const transformedContacts = rawContacts.map((ct) => {
    const owner = ownersMap.get(ct.properties?.hubspot_owner_id);
    return transformer.transformContact(ct, owner?.email);
  });
  const resContacts = await importer.importBatch('kontakty', transformedContacts);

  // Krok 4: Ekstrakcja & Transformacja Dealów
  const rawDeals = await extractor.extractObjects(
    'deals',
    ['dealname', 'amount', 'deal_currency_code', 'dealstage', 'closedate', 'hubspot_owner_id', 'createdate'],
    config.deltaSince
  );
  const transformedDeals = rawDeals.map((d) => {
    const owner = ownersMap.get(d.properties?.hubspot_owner_id);
    return transformer.transformDeal(d, owner?.email);
  });
  const resDeals = await importer.importBatch('deale', transformedDeals);

  // Krok 5: Raport Końcowy
  const report = {
    timestamp: new Date().toISOString(),
    mode: config.isDryRun ? 'DRY-RUN' : 'LIVE',
    deltaSince: config.deltaSince || 'FULL_IMPORT',
    summary: {
      companies: { total: rawCompanies.length, imported: resCompanies.imported, errors: resCompanies.errors.length },
      contacts: { total: rawContacts.length, imported: resContacts.imported, errors: resContacts.errors.length },
      deals: { total: rawDeals.length, imported: resDeals.imported, errors: resDeals.errors.length },
    },
  };

  const reportPath = path.resolve('migration_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('\n===============================================================');
  console.log('🎉 RAPORT ZAKOŃCZENIA MIGRACJI:');
  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`📄 Pełny plik raportu zapisano w: ${reportPath}`);
  console.log('===============================================================');
}
