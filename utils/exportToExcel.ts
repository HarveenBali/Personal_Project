import * as XLSX from 'xlsx';
import type { ChangeRequestRecord } from '../features/reporting/reportingSlice';

function getValue(record: ChangeRequestRecord, column: string): unknown {
  return column.split('.').reduce<unknown>((value, key) => {
    if (value === null || typeof value !== 'object') {
      return undefined;
    }
    return (value as Record<string, unknown>)[key];
  }, record);
}

function formatValue(value: unknown): string | number | boolean {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return JSON.stringify(value) ?? '';
}

export function exportToExcel(
  visibleColumns: string[],
  filteredRecords: ChangeRequestRecord[],
  filename = 'change-requests.xlsx',
): void {
  if (typeof window === 'undefined') {
    throw new Error('Excel export is only available in the browser.');
  }
  if (visibleColumns.length === 0) {
    throw new Error('At least one visible column is required for Excel export.');
  }

  const rows = filteredRecords.map((record) =>
    Object.fromEntries(
      visibleColumns.map((column) => [column, formatValue(getValue(record, column))]),
    ),
  );
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: visibleColumns });
  worksheet['!cols'] = visibleColumns.map((column) => ({
    wch: Math.min(
      60,
      Math.max(
        column.length,
        ...rows.map((row) => String(row[column] ?? '').length),
      ) + 2,
    ),
  }));
  if (filteredRecords.length > 0) {
    worksheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: filteredRecords.length, c: visibleColumns.length - 1 },
      }),
    };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Change Requests');
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`, {
    bookType: 'xlsx',
    cellStyles: true,
  });
}
