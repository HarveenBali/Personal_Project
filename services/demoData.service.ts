import type { ChangeRequestRecord } from '../types/reporting.types';

const STORAGE_KEY = 'change-request-demo-records';

function dateFromToday(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

function createSampleRecords(): ChangeRequestRecord[] {
  return [
    {
      crId: 'CR-1042',
      title: 'Upgrade customer portal dependencies',
      category: 'Application',
      priority: 'HIGH',
      status: 'IN_REVIEW',
      requestedBy: 'Alex Morgan',
      slaDueDate: dateFromToday(-2),
      estimatedCost: 1200,
      createdAt: dateFromToday(-9),
    },
    {
      crId: 'CR-1043',
      title: 'Rotate production service credentials',
      category: 'Security',
      priority: 'CRITICAL',
      status: 'SUBMITTED',
      requestedBy: 'Jordan Lee',
      slaDueDate: dateFromToday(1),
      estimatedCost: 0,
      createdAt: dateFromToday(-3),
    },
    {
      crId: 'CR-1044',
      title: 'Expand database storage capacity',
      category: 'Infrastructure',
      priority: 'MEDIUM',
      status: 'APPROVED',
      requestedBy: 'Taylor Kim',
      slaDueDate: dateFromToday(4),
      estimatedCost: 8500,
      createdAt: dateFromToday(-6),
    },
    {
      crId: 'CR-1045',
      title: 'Update internal knowledge base',
      category: 'Application',
      priority: 'LOW',
      status: 'DRAFT',
      requestedBy: 'Morgan Patel',
      slaDueDate: dateFromToday(8),
      estimatedCost: 300,
      createdAt: dateFromToday(-1),
    },
    {
      crId: 'CR-1046',
      title: 'Deploy network monitoring agents',
      category: 'Infrastructure',
      priority: 'HIGH',
      status: 'DEPLOYED',
      requestedBy: 'Casey Rivera',
      slaDueDate: dateFromToday(-5),
      estimatedCost: 2400,
      createdAt: dateFromToday(-15),
    },
  ];
}

function isChangeRequestArray(value: unknown): value is ChangeRequestRecord[] {
  return (
    Array.isArray(value) &&
    value.every(
      (record) =>
        record !== null && typeof record === 'object' && !Array.isArray(record),
    )
  );
}

export function getDemoChangeRequests(): ChangeRequestRecord[] {
  if (typeof window === 'undefined') {
    return createSampleRecords();
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored !== null) {
    const parsed: unknown = JSON.parse(stored);
    if (!isChangeRequestArray(parsed)) {
      throw new Error('Saved demo change request data is invalid.');
    }
    return parsed;
  }

  const records = createSampleRecords();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  return records;
}

export function saveDemoChangeRequest(
  formData: Record<string, unknown>,
): ChangeRequestRecord {
  if (typeof window === 'undefined') {
    throw new Error('Demo submissions are only available in the browser.');
  }

  const record: ChangeRequestRecord = {
    ...formData,
    crId: `CR-${Date.now()}`,
    title: String(formData.title ?? 'Untitled change request'),
    category: String(formData.category ?? 'Other'),
    priority:
      formData.priority === 'LOW' ||
      formData.priority === 'MEDIUM' ||
      formData.priority === 'HIGH' ||
      formData.priority === 'CRITICAL'
        ? formData.priority
        : 'MEDIUM',
    status: 'SUBMITTED',
    requestedBy: String(formData.requestedBy ?? 'Demo user'),
    slaDueDate: String(formData.slaDueDate ?? dateFromToday(7)),
    estimatedCost: Number(formData.estimatedCost ?? 0),
    createdAt: new Date().toISOString(),
  };
  const records = getDemoChangeRequests();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...records]));
  return record;
}
