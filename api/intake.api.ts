import { httpClient } from '../services/http.service';
import { isDemoMode } from '../config/api.config';
import { saveDemoChangeRequest } from '../services/demoData.service';
import type { ChangeRequestRecord } from '../types/reporting.types';

export async function submitChangeRequest(
  formData: Record<string, unknown>,
): Promise<ChangeRequestRecord> {
  if (isDemoMode) {
    return saveDemoChangeRequest(formData);
  }

  const response = await httpClient.post<ChangeRequestRecord>('/intake', formData);
  return response.data;
}
