import type { FilterOperator } from '../types/reporting.types';

export const FILTER_OPERATORS: Array<{
  value: FilterOperator;
  label: string;
}> = [
  { value: 'equals', label: 'equals' },
  { value: 'notEquals', label: 'does not equal' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'greaterThan', label: 'greater than' },
  { value: 'greaterThanOrEqual', label: 'greater than or equal to' },
  { value: 'lessThan', label: 'less than' },
  { value: 'lessThanOrEqual', label: 'less than or equal to' },
  { value: 'between', label: 'between (comma-separated)' },
  { value: 'in', label: 'is one of (comma-separated)' },
  { value: 'isEmpty', label: 'is empty' },
  { value: 'isNotEmpty', label: 'is not empty' },
];
