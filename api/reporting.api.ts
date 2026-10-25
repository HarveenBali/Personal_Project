import { httpClient } from '../services/http.service';
import { isDemoMode } from '../config/api.config';
import { getDemoChangeRequests } from '../services/demoData.service';
import type { ChangeRequestRecord } from '../types/reporting.types';

function isRecordArray(value: unknown): value is ChangeRequestRecord[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => item !== null && typeof item === 'object' && !Array.isArray(item),
    )
  );
}

function extractRecords(payload: unknown): ChangeRequestRecord[] {
  if (isRecordArray(payload)) {
    return payload;
  }

  if (payload !== null && typeof payload === 'object') {
    const result = payload as Record<string, unknown>;
    if (isRecordArray(result.records)) {
      return result.records;
    }
    if (isRecordArray(result.data)) {
      return result.data;
    }
    if (result.data !== null && typeof result.data === 'object') {
      const nestedData = result.data as Record<string, unknown>;
      if (isRecordArray(nestedData.records)) {
        return nestedData.records;
      }
    }

    const message = result.message ?? result.error;
    if (typeof message === 'string' && message) {
      throw new Error(`Reporting API error: ${message}`);
    }
  }

  if (typeof payload === 'string' && /^\s*</.test(payload)) {
    throw new Error(
      'The reporting endpoint returned HTML instead of records. Set NEXT_PUBLIC_API_URL to your backend API URL and restart the dev server.',
    );
  }

  throw new Error(
    'The reporting endpoint returned an unsupported response. Expected an array of records or an object containing a records/data array.',
  );
}

export async function getChangeRequests(): Promise<ChangeRequestRecord[]> {
  if (isDemoMode) {
    return getDemoChangeRequests();
  }

  const response = await httpClient.get<unknown>('/reporting');
  return extractRecords(response.data);
}
