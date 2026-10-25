'use client';

import { useMemo, useState, type UIEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setColumnVisibility,
  setSelectedRows,
  type ChangeRequestRecord,
} from '../../features/reporting/reportingSlice';
import { useWorkerFilter } from '../../hooks/useWorkerFilter';
import type { AppDispatch, RootState } from '../../store';

interface VirtualizedReportGridProps {
  records?: ChangeRequestRecord[];
  filteredRecords?: ChangeRequestRecord[];
  isFiltering?: boolean;
  filterError?: string | null;
  height?: number;
  rowHeight?: number;
  overscan?: number;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

function displayValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;
  if (typeof left === 'number' && typeof right === 'number') {
    return left - right;
  }
  return displayValue(left).localeCompare(displayValue(right), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function getRowId(record: ChangeRequestRecord): string {
  const id = record.crId ?? record.id ?? record.requestId ?? record.changeRequestId;
  return id == null ? JSON.stringify(record) ?? '' : String(id);
}

export function VirtualizedReportGrid({
  records: suppliedRecords,
  filteredRecords: suppliedFilteredRecords,
  isFiltering: suppliedIsFiltering,
  filterError: suppliedFilterError,
  height = 560,
  rowHeight = 40,
  overscan = 8,
}: VirtualizedReportGridProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    records: storeRecords,
    filterGroup,
    selectedRows,
    columnVisibility,
  } = useSelector((state: RootState) => state.reporting);
  const records = suppliedRecords ?? storeRecords;
  const {
    filteredRecords: workerFilteredRecords,
    isFiltering: workerIsFiltering,
    error: workerError,
  } = useWorkerFilter(
    records,
    filterGroup,
    suppliedFilteredRecords === undefined,
  );
  const filteredRecords = suppliedFilteredRecords ?? workerFilteredRecords;
  const isFiltering =
    suppliedFilteredRecords === undefined
      ? workerIsFiltering
      : suppliedIsFiltering ?? false;
  const error =
    suppliedFilteredRecords === undefined ? workerError : suppliedFilterError ?? null;
  const [sort, setSort] = useState<SortState | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const selectedRowSet = useMemo(() => new Set(selectedRows), [selectedRows]);

  const columns = useMemo(
    () =>
      Array.from(new Set(records.flatMap((record) => Object.keys(record)))).sort(),
    [records],
  );
  const visibleColumns = columns.filter(
    (column) => columnVisibility[column] !== false,
  );
  const sortedRecords = useMemo(() => {
    if (!sort) {
      return filteredRecords;
    }
    return [...filteredRecords].sort((left, right) => {
      const result = compareValues(left[sort.field], right[sort.field]);
      return sort.direction === 'asc' ? result : -result;
    });
  }, [filteredRecords, sort]);

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const endIndex = Math.min(sortedRecords.length, startIndex + visibleCount);
  const visibleRows = sortedRecords.slice(startIndex, endIndex);
  const topSpacerHeight = startIndex * rowHeight;
  const bottomSpacerHeight = (sortedRecords.length - endIndex) * rowHeight;

  const setScrollPosition = (event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  const toggleSort = (field: string) => {
    setSort((current) =>
      current?.field === field
        ? { field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { field, direction: 'asc' },
    );
  };

  const toggleColumn = (column: string) => {
    dispatch(
      setColumnVisibility({
        ...columnVisibility,
        [column]: columnVisibility[column] === false,
      }),
    );
  };

  const toggleRow = (id: string) => {
    dispatch(
      setSelectedRows(
        selectedRowSet.has(id)
          ? selectedRows.filter((selectedId) => selectedId !== id)
          : [...selectedRows, id],
      ),
    );
  };

  const allVisibleSelected =
    sortedRecords.length > 0 &&
    sortedRecords.every((record) => selectedRowSet.has(getRowId(record)));

  const toggleAllRows = () => {
    const rowIds = new Set(sortedRecords.map(getRowId));
    dispatch(
      setSelectedRows(
        allVisibleSelected
          ? selectedRows.filter((id) => !rowIds.has(id))
          : Array.from(new Set([...selectedRows, ...rowIds])),
      ),
    );
  };

  return (
    <section aria-label="Report results">
      <div aria-label="Column visibility" role="group">
        {columns.map((column) => (
          <label key={column}>
            <input
              type="checkbox"
              checked={columnVisibility[column] !== false}
              onChange={() => toggleColumn(column)}
            />
            {column}
          </label>
        ))}
      </div>

      {isFiltering && <p role="status">Filtering report…</p>}
      {error && <p role="alert">Unable to filter report: {error}</p>}
      <p aria-live="polite">
        {sortedRecords.length.toLocaleString()} records
        {selectedRows.length > 0 &&
          ` · ${selectedRows.length.toLocaleString()} selected`}
      </p>

      <div
        onScroll={setScrollPosition}
        style={{ height, overflow: 'auto', position: 'relative' }}
        role="region"
        aria-label="Scrollable report grid"
      >
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: 'Canvas',
            }}
          >
            <tr style={{ height: rowHeight }}>
              <th scope="col">
                <input
                  type="checkbox"
                  aria-label="Select all filtered rows"
                  checked={allVisibleSelected}
                  onChange={toggleAllRows}
                />
              </th>
              {visibleColumns.map((column) => (
                <th key={column} scope="col" aria-sort={
                  sort?.field === column
                    ? sort.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }>
                  <button type="button" onClick={() => toggleSort(column)}>
                    {column}
                    {sort?.field === column
                      ? sort.direction === 'asc'
                        ? ' ▲'
                        : ' ▼'
                      : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={visibleColumns.length + 1}
                  style={{ height: topSpacerHeight, padding: 0, border: 0 }}
                />
              </tr>
            )}
            {visibleRows.map((record) => {
              const id = getRowId(record);
              return (
                <tr key={id} style={{ height: rowHeight }}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select row ${id}`}
                      checked={selectedRowSet.has(id)}
                      onChange={() => toggleRow(id)}
                    />
                  </td>
                  {visibleColumns.map((column) => (
                    <td
                      key={column}
                      style={{
                        height: rowHeight,
                        maxHeight: rowHeight,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {displayValue(record[column])}
                    </td>
                  ))}
                </tr>
              );
            })}
            {bottomSpacerHeight > 0 && (
              <tr aria-hidden="true">
                <td
                  colSpan={visibleColumns.length + 1}
                  style={{ height: bottomSpacerHeight, padding: 0, border: 0 }}
                />
              </tr>
            )}
            {!isFiltering && !error && sortedRecords.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length + 1}>No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
