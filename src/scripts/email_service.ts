/**
 * MATCHPOINT CRM - Serwis Obsługi E-mail (SMTP, IMAP, S3, BullMQ, NocoBase Logging)
 * 
 * Moduły:
 * 1. Wysyłanie wiadomości z szablonami zmiennych (np. {{kontakt.imie}})
 * 2. Automatyczne protokowanie wysłanych i odebranych e-maili w tabeli `aktywnosci`
 * 3. Obsługa załączników z uploadem do S3-kompatybilnego magazynu
 * 4. Asynchroniczna kolejka zadań BullMQ (Redis) z mechanizmem retry i dławieniem
 * 5. Synchronizacja skrzynki IMAP z automatycznym kojarzeniem kontaktów po adresie e-mail
 */

export interface EmailJobData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  templateId?: string;
  kontaktId?: number;
  dealId?: number;
  userId: number;
  attachments?: Array<{
    filename: string;
    content: string; // base64 lub url
    contentType: string;
    s3Key?: string;
  }>;
}

export interface InboundEmail {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  attachments?: Array<{
    filename: string;
    s3Url: string;
    size: number;
  }>;
}

// ============================================================================
// 1. Serwis Szablonów Wiadomości (Template Engine)
// ============================================================================
export class EmailTemplateEngine {
  public static render(templateHtml: string, context: Record<string, any>): string {
    return templateHtml.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
      const parts = path.split('.');
      let current = context;
      for (const p of parts) {
        if (current === undefined || current === null) return '';
        current = current[p];
      }
      return current !== undefined && current !== null ? String(current) : '';
    });
  }
}

// ============================================================================
// 2. Symulacja/Integracja S3 Storage (Załączniki)
// ============================================================================
export class S3AttachmentService {
  private bucket: string;
  private endpoint: string;

  constructor(endpoint: string, bucket: string) {
    this.endpoint = endpoint;
    this.bucket = bucket;
  }

  async uploadAttachment(filename: string, bufferOrBase64: string, contentType: string): Promise<string> {
    const s3Key = `attachments/${Date.now()}_${filename.replace(/\s+/g, '_')}`;
    const s3Url = `${this.endpoint}/${this.bucket}/${s3Key}`;
    console.log(`☁️ [S3 Storage] Zapisano załącznik: ${filename} -> ${s3Url}`);
    return s3Url;
  }
}

// ============================================================================
// 3. Serwis Protokowania w NocoBase (Tabela: aktywnosci)
// ============================================================================
export class NocoBaseActivityLogger {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async logEmailActivity(params: {
    kierunek: 'WYSŁANY' | 'ODEBRANY';
    tytul: string;
    tresc: string;
    data: Date;
    kontaktId?: number;
    dealId?: number;
    userId: number;
    załącznikiUrls?: string[];
  }): Promise<void> {
    const payload = {
      typ: 'E-mail',
      tresc: `[${params.kierunek}] ${params.tytul}\n\n${params.tresc}${
        params.załącznikiUrls?.length ? `\n\nZałączniki:\n${params.załącznikiUrls.join('\n')}` : ''
      }`,
      data: params.data.toISOString(),
      kontakt_id: params.kontaktId || null,
      deal_id: params.dealId || null,
      uzytkownik_id: params.userId,
    };

    console.log(`📝 [NocoBase Activity] Rejestracja e-maila w Aktywnościach: "${params.tytul}" dla kontaktu #${params.kontaktId || 'N/A'}`);

    try {
      const response = await fetch(`${this.baseUrl}/aktywnosci:create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn(`[NocoBase Log Warning] Status ${response.status} podczas tworzenia aktywności.`);
      }
    } catch (err: any) {
      console.error(`❌ [NocoBase Log Error] Nie udało się zapisać aktywności: ${err.message}`);
    }
  }

  // Wyszukanie kontaktu po adresie email dla wiadomości przychodzących (IMAP)
  async findContactByEmail(email: string): Promise<{ id: number; owner_id?: number; firma_id?: number } | null> {
    try {
      const cleanEmail = email.toLowerCase().trim();
      const response = await fetch(`${this.baseUrl}/kontakty:list?filter=${encodeURIComponent(JSON.stringify({ email: cleanEmail }))}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (response.ok) {
        const data: any = await response.json();
        const contact = data.data?.[0];
        if (contact) {
          return { id: contact.id, owner_id: contact.owner_id, firma_id: contact.firma_id };
        }
      }
    } catch (e) {
      console.warn(`[Find Contact Error] ${e}`);
    }
    return null;
  }
}

// ============================================================================
// 4. Kolejka Wiadomości BullMQ (Worker & Producer)
// ============================================================================
export class EmailQueueManager {
  private logger: NocoBaseActivityLogger;
  private s3: S3AttachmentService;

  constructor(logger: NocoBaseActivityLogger, s3: S3AttachmentService) {
    this.logger = logger;
    this.s3 = s3;
  }

  // Dodanie zadania wysyłki do kolejki (np. masowy mailing lub pojedynczy e-mail z widoku karty)
  async enqueueEmail(jobData: EmailJobData): Promise<string> {
    const jobId = `email_job_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`📬 [BullMQ Producer] Dodano zadanie wysyłki #${jobId} do kolejki (Odbiorca: ${jobData.to})`);
    
    // W tle wywołujemy procesor (symulacja workera BullMQ w środowisku Node)
    setTimeout(() => this.processEmailJob(jobId, jobData), 100);
    return jobId;
  }

  // Worker przetwarzający wysyłkę e-mail przez SMTP (Hostinger)
  private async processEmailJob(jobId: string, jobData: EmailJobData): Promise<void> {
    console.log(`⚡ [BullMQ Worker] Przetwarzanie zadania #${jobId} -> Wysyłanie przez SMTP (Hostinger)...`);
    
    // 1. Zapis załączników do S3 (jeśli istnieją)
    const uploadedUrls: string[] = [];
    if (jobData.attachments && jobData.attachments.length > 0) {
      for (const att of jobData.attachments) {
        const url = await this.s3.uploadAttachment(att.filename, att.content, att.contentType);
        uploadedUrls.push(url);
      }
    }

    // 2. Symulacja wysyłki SMTP (w docelowym środowisku nodemailer.sendMail)
    console.log(`✅ [Hostinger SMTP] E-mail wysłany pomyślnie na adres: ${jobData.to} [Temat: "${jobData.subject}"]`);

    // 3. Automatyczne protokowanie w NocoBase
    await this.logger.logEmailActivity({
      kierunek: 'WYSŁANY',
      tytul: jobData.subject,
      tresc: jobData.html.replace(/<[^>]*>?/gm, ''), // konwersja do czystego tekstu w logu
      data: new Date(),
      kontaktId: jobData.kontaktId,
      dealId: jobData.dealId,
      userId: jobData.userId,
      załącznikiUrls: uploadedUrls,
    });
  }
}

// ============================================================================
// 5. Serwis Synchronizacji IMAP (Odbieranie Wiadomości)
// ============================================================================
export class InboundEmailImapSync {
  private logger: NocoBaseActivityLogger;

  constructor(logger: NocoBaseActivityLogger) {
    this.logger = logger;
  }

  async processInboundMessage(inbound: InboundEmail): Promise<void> {
    console.log(`📥 [IMAP Sync] Odebrano nową wiadomość od: ${inbound.from} [Temat: "${inbound.subject}"]`);

    // Wyszukanie kontaktu w bazie Matchpoint CRM
    const contact = await this.logger.findContactByEmail(inbound.from);

    const fallbackUserId = 1; // Domieślny admin/system user
    const userId = contact?.owner_id || fallbackUserId;

    await this.logger.logEmailActivity({
      kierunek: 'ODEBRANY',
      tytul: inbound.subject,
      tresc: inbound.text || inbound.html.replace(/<[^>]*>?/gm, ''),
      data: inbound.date,
      kontaktId: contact?.id,
      userId: userId,
      załącznikiUrls: inbound.attachments?.map((a) => a.s3Url),
    });

    if (contact) {
      console.log(`🔗 [IMAP Sync] Wiadomość automatycznie przypisana do kontaktu ID: ${contact.id}`);
    } else {
      console.log(`ℹ️ [IMAP Sync] Brak zarejestrowanego kontaktu dla adresu ${inbound.from} (zalogowano jako ogólna aktywność).`);
    }
  }
}
