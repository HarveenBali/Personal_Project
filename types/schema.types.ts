export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'richtext'
  | 'date';

export interface VisibilityRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'in';
  value: unknown;
}

export interface DynamicFormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string | number }>;
  dependsOn?: VisibilityRule;
  validation?: {
    min?: number;
    max?: number;
    regex?: string;
  };
}

export interface DynamicFormSchema {
  stepId: string;
  stepTitle: string;
  fields: DynamicFormField[];
}
