export type FilterOperator =
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'between'
  | 'in'
  | 'notEquals'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export interface FilterGroup {
  conjunction: 'AND' | 'OR';
  conditions: Array<FilterCondition | FilterGroup>;
}

export interface ChangeRequestRecord {
  crId: string;
  title: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'DEPLOYED';
  requestedBy: string;
  slaDueDate: string;
  estimatedCost: number;
  createdAt: string;
  [key: string]: unknown;
}
