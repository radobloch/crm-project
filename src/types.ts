export type FieldType =
  | 'text'
  | 'longtext'
  | 'number'
  | 'currency'
  | 'percent'
  | 'select'
  | 'multi-select'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'relation-has-many'
  | 'relation-belongs-to'
  | 'user'
  | 'attachment'
  | 'rating'
  | 'tags'
  | 'formula';

export interface FieldOption {
  label: string;
  value: string;
  color?: string;
}

export interface CollectionField {
  id: string;
  name: string;
  title: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  defaultValue?: any;
  options?: FieldOption[];
  targetCollectionId?: string; // for relations
  targetFieldId?: string;
  description?: string;
  isPrimary?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  title: string;
  icon?: string;
  color?: string;
  description?: string;
  category?: string;
  fields: CollectionField[];
  createdAt: string;
}

export type ViewType = 'table' | 'kanban' | 'calendar' | 'gallery' | 'form' | 'dashboard';

export interface FilterCondition {
  fieldId: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: any;
}

export interface SortCondition {
  fieldId: string;
  direction: 'asc' | 'desc';
}

export interface RecordItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action_create' | 'action_update' | 'action_email' | 'action_ai' | 'action_webhook';
  title: string;
  description?: string;
  config: {
    collectionId?: string;
    triggerType?: 'on_create' | 'on_update' | 'on_delete' | 'manual' | 'schedule';
    conditionField?: string;
    conditionOp?: string;
    conditionVal?: string;
    targetField?: string;
    targetValue?: string;
    aiPrompt?: string;
    webhookUrl?: string;
  };
  next?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggerCollectionId: string;
  triggerEvent: 'create' | 'update' | 'delete' | 'manual';
  nodes: WorkflowNode[];
  executionCount: number;
  lastExecutedAt?: string;
}

export interface WorkflowExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'success' | 'failed' | 'running';
  timestamp: string;
  durationMs: number;
  details: string;
}

export interface RolePermission {
  roleId: string;
  roleName: string;
  description: string;
  permissions: {
    [collectionId: string]: {
      create: boolean;
      read: boolean;
      update: boolean;
      delete: boolean;
      export: boolean;
    };
  };
}
