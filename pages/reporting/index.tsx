import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getChangeRequests } from '../../api/reporting.api';
import { AdvancedFilterBuilder } from '../../components/reporting/AdvancedFilterBuilder';
import { ReportAnalyticsCharts } from '../../components/reporting/ReportAnalyticsCharts';
import type { SlaBreachPoint } from '../../components/reporting/ReportAnalyticsCharts';
import { VirtualizedReportGrid } from '../../components/reporting/VirtualizedReportGrid';
import {
  setRecords,
  setStatus,
} from '../../features/reporting/reportingSlice';
import { isDemoMode } from '../../config/api.config';
import { useWorkerFilter } from '../../hooks/useWorkerFilter';
import type { AppDispatch, RootState } from '../../store';
import { exportToExcel } from '../../utils/exportToExcel';
import { exportToPdf } from '../../utils/exportToPdf';

export default function ReportingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { records, filterGroup, columnVisibility, status } = useSelector(
    (state: RootState) => state.reporting,
  );
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const reportContent = useRef<HTMLDivElement>(null);
  const { filteredRecords, isFiltering, error: filterError } = useWorkerFilter(
    records,
    filterGroup,
  );
  const visibleColumns = useMemo(
    () =>
      Array.from(new Set(records.flatMap((record) => Object.keys(record))))
        .filter((column) => columnVisibility[column] !== false)
        .sort(),
    [records, columnVisibility],
  );
  const slaBreaches = useMemo<SlaBreachPoint[]>(() => {
    const counts = new Map<string, number>();
    const now = new Date();
    for (const record of filteredRecords) {
      if (typeof record.slaDueDate !== 'string') continue;
      const dueDate = new Date(record.slaDueDate);
      if (Number.isNaN(dueDate.getTime())) continue;
      const date = dueDate.toISOString().slice(0, 10);
      const isOpen = !['APPROVED', 'DEPLOYED'].includes(
        String(record.status).toUpperCase(),
      );
      counts.set(
        date,
        (counts.get(date) ?? 0) + (isOpen && dueDate < now ? 1 : 0),
      );
    }
    return Array.from(counts, ([date, breaches]) => ({ date, breaches })).sort(
      (left, right) => left.date.localeCompare(right.date),
    );
  }, [filteredRecords]);

  useEffect(() => {
    let active = true;
    setError(null);
    dispatch(setStatus('loading'));
    getChangeRequests()
      .then((data) => {
        if (!active) return;
        dispatch(setRecords(data));
        dispatch(setStatus('succeeded'));
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Unable to load change requests.',
        );
        dispatch(setStatus('failed'));
      });
    return () => {
      active = false;
    };
  }, [dispatch]);

  const handleExcelExport = () => {
    setExportError(null);
    try {
      exportToExcel(visibleColumns, filteredRecords);
    } catch (exportFailure) {
      setExportError(
        exportFailure instanceof Error ? exportFailure.message : 'Excel export failed.',
      );
    }
  };

  const handlePdfExport = async () => {
    setExportError(null);
    if (!reportContent.current) {
      setExportError('The report view is not ready for PDF export.');
      return;
    }
    try {
      await exportToPdf(reportContent.current);
    } catch (exportFailure) {
      setExportError(
        exportFailure instanceof Error ? exportFailure.message : 'PDF export failed.',
      );
    }
  };

  return (
    <section>
      <h1>Change request reporting</h1>
      <p>
        {status === 'loading'
          ? 'Loading change requests…'
          : `${records.length.toLocaleString()} change requests`}
      </p>
      {isDemoMode && (
        <p role="status">
          Demo mode: sample change requests are stored in this browser.
        </p>
      )}
      {error && <p role="alert">Unable to load reports: {error}</p>}
      {exportError && <p role="alert">{exportError}</p>}
      <div>
        <button
          type="button"
          onClick={handleExcelExport}
          disabled={!records.length || isFiltering}
        >
          Export filtered rows to Excel
        </button>
        <button
          type="button"
          onClick={handlePdfExport}
          disabled={!records.length || isFiltering}
        >
          Export report to PDF
        </button>
      </div>
      <div ref={reportContent}>
        <AdvancedFilterBuilder />
        <ReportAnalyticsCharts
          records={filteredRecords}
          slaBreaches={slaBreaches}
        />
        <VirtualizedReportGrid
          records={records}
          filteredRecords={filteredRecords}
          isFiltering={isFiltering}
          filterError={filterError}
        />
      </div>
    </section>
  );
}
