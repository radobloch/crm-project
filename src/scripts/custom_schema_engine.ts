/**
 * MATCHPOINT CRM - Dynamiczny Generator Kolekcji i Pól w NocoBase (No-Deployment Schema Engine)
 * 
 * Umożliwia:
 * 1. Tworzenie nowych tabel/kolekcji w locie (Runtime Collection Creation przez REST API NocoBase)
 * 2. Dynamiczne dodawanie pól niestandardowych (custom fields) do istniejących kolekcji (np. deale, firmy, kontakty)
 * 3. Nadawanie uprawnień RBAC dla ról per moduł
 */

export interface CustomFieldDefinition {
  name: string;
  type: 'string' | 'text' | 'integer' | 'decimal' | 'boolean' | 'date' | 'datetime' | 'select' | 'belongsTo' | 'hasMany';
  title?: string;
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  options?: Array<{ label: string; value: string; color?: string }> | string[];
  target?: string;
  foreignKey?: string;
}

export interface CustomCollectionDefinition {
  name: string;
  title: string;
  fields: CustomFieldDefinition[];
}

export class NocoBaseSchemaEngine {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  // 1. Dynamiczne utworzenie nowej kolekcji w NocoBase bez restartu/deployu
  async createCollection(def: CustomCollectionDefinition): Promise<boolean> {
    console.log(`📦 [NocoBase Schema Engine] Tworzenie nowej kolekcji: "${def.title}" (tabela: ${def.name})...`);

    const payload = {
      name: def.name,
      title: def.title,
      fields: def.fields.map((f) => this.mapFieldPayload(f)),
    };

    try {
      const res = await fetch(`${this.baseUrl}/collections:create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn(`[Schema Engine] Informacja/Status ${res.status}:`, err);
        return false;
      }

      console.log(`✅ [NocoBase Schema Engine] Kolekcja "${def.name}" została utworzona w bazie PostgreSQL 18.`);
      return true;
    } catch (e: any) {
      console.error(`❌ [Schema Engine Error] Nie udało się utworzyć kolekcji: ${e.message}`);
      return false;
    }
  }

  // 2. Dodawanie nowego pola do istniejącej kolekcji (np. 'kontakty', 'deale')
  async addFieldToCollection(collectionName: string, field: CustomFieldDefinition): Promise<boolean> {
    console.log(`🔧 [NocoBase Schema Engine] Dodawanie pola "${field.name}" (${field.type}) do kolekcji [${collectionName}]...`);

    const payload = this.mapFieldPayload(field);

    try {
      const res = await fetch(`${this.baseUrl}/collections/${collectionName}/fields:create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn(`[Field Creation] Status ${res.status}`);
        return false;
      }

      console.log(`✅ [NocoBase Schema Engine] Pole "${field.name}" dodane do [${collectionName}].`);
      return true;
    } catch (e: any) {
      console.error(`❌ Błąd dodawania pola: ${e.message}`);
      return false;
    }
  }

  // 3. Konwersja definicji pola na format NocoBase Field Schema
  private mapFieldPayload(field: CustomFieldDefinition): Record<string, any> {
    const base: Record<string, any> = {
      name: field.name,
      type: field.type,
      uiSchema: {
        title: field.title || field.name,
        'x-component': this.resolveUiComponent(field.type),
      },
    };

    if (field.required) base.allowNull = false;
    if (field.unique) base.unique = true;
    if (field.defaultValue !== undefined) base.defaultValue = field.defaultValue;

    if (field.type === 'select' && field.options) {
      base.uiSchema.enum = field.options.map((opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt));
    }

    if (field.type === 'belongsTo') {
      base.target = field.target;
      base.foreignKey = field.foreignKey || `${field.name}_id`;
    }

    return base;
  }

  private resolveUiComponent(type: string): string {
    switch (type) {
      case 'string':
        return 'Input';
      case 'text':
        return 'Input.TextArea';
      case 'integer':
      case 'decimal':
        return 'InputNumber';
      case 'boolean':
        return 'Checkbox';
      case 'date':
      case 'datetime':
        return 'DatePicker';
      case 'select':
        return 'Select';
      case 'belongsTo':
        return 'AssociationField';
      default:
        return 'Input';
    }
  }
}
