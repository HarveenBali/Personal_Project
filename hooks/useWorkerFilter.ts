'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  ChangeRequestRecord,
  FilterCondition,
  FilterGroup,
} from '../features/reporting/reportingSlice';

type FilterNode = FilterGroup | FilterCondition;

interface WorkerResult {
  requestId: number;
  records?: ChangeRequestRecord[];
  error?: string;
}

const workerSource = `
  function valueAt(record, field) {
    return field.split('.').reduce(function (value, key) {
      return value == null ? undefined : value[key];
    }, record);
  }

  function matchesCondition(record, condition) {
    var actual = valueAt(record, condition.field);
    var expected = condition.value;
    var actualText = actual == null ? '' : String(actual);
    var actualNumber = Number(actual);
    var expectedNumber = Number(expected);
    var expectedText = String(expected == null ? '' : expected);

    switch (condition.operator) {
      case 'equals':
        return actualText.toLowerCase() === expectedText.toLowerCase();
      case 'notEquals':
        return actualText.toLowerCase() !== expectedText.toLowerCase();
      case 'contains':
        return actualText.toLowerCase().includes(expectedText.toLowerCase());
      case 'startsWith':
        return actualText.toLowerCase().startsWith(expectedText.toLowerCase());
      case 'greaterThan':
        return actual != null && !Number.isNaN(actualNumber) && actualNumber > expectedNumber;
      case 'greaterThanOrEqual':
        return actual != null && !Number.isNaN(actualNumber) && actualNumber >= expectedNumber;
      case 'lessThan':
        return actual != null && !Number.isNaN(actualNumber) && actualNumber < expectedNumber;
      case 'lessThanOrEqual':
        return actual != null && !Number.isNaN(actualNumber) && actualNumber <= expectedNumber;
      case 'between':
        return Array.isArray(expected) &&
          expected.length === 2 &&
          actual != null &&
          !Number.isNaN(actualNumber) &&
          actualNumber >= Number(expected[0]) &&
          actualNumber <= Number(expected[1]);
      case 'in':
        return Array.isArray(expected) &&
          expected.some(function (value) {
            return actualText.toLowerCase() === String(value).toLowerCase();
          });
      case 'isEmpty':
        return actual == null || actualText.trim() === '';
      case 'isNotEmpty':
        return actual != null && actualText.trim() !== '';
      default:
        return false;
    }
  }

  function matchesGroup(record, group) {
    if (group.conditions.length === 0) return group.conjunction === 'AND';
    var matcher = group.conjunction === 'AND' ? 'every' : 'some';
    return group.conditions[matcher](function (node) {
      return Array.isArray(node.conditions)
        ? matchesGroup(record, node)
        : matchesCondition(record, node);
    });
  }

  self.onmessage = function (event) {
    var request = event.data;
    try {
      var records = request.records.filter(function (record) {
        return matchesGroup(record, request.filterGroup);
      });
      self.postMessage({ requestId: request.requestId, records: records });
    } catch (error) {
      self.postMessage({
        requestId: request.requestId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  };
`;

export function useWorkerFilter(
  records: ChangeRequestRecord[],
  filterGroup: FilterGroup,
  enabled = true,
) {
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const [filteredRecords, setFilteredRecords] = useState<ChangeRequestRecord[]>([]);
  const [isFiltering, setIsFiltering] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let workerUrl: string;
    let worker: Worker;

    try {
      workerUrl = URL.createObjectURL(
        new Blob([workerSource], { type: 'text/javascript' }),
      );
      worker = new Worker(workerUrl);
    } catch (workerError) {
      setError(
        workerError instanceof Error
          ? workerError.message
          : 'Unable to initialize the report filter worker.',
      );
      setIsFiltering(false);
      return;
    }

    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<WorkerResult>) => {
      if (event.data.requestId !== requestIdRef.current) {
        return;
      }
      if (event.data.error) {
        setError(event.data.error);
      } else {
        setFilteredRecords(event.data.records ?? []);
        setError(null);
      }
      setIsFiltering(false);
    };
    worker.onerror = (event) => {
      setError(event.message || 'The report filter worker failed.');
      setIsFiltering(false);
    };

    return () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      workerRef.current = null;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !workerRef.current) {
      return;
    }

    requestIdRef.current += 1;
    setIsFiltering(true);
    setError(null);
    try {
      workerRef.current.postMessage({
        requestId: requestIdRef.current,
        records,
        filterGroup,
      });
    } catch (workerError) {
      setError(
        workerError instanceof Error
          ? workerError.message
          : 'Unable to send report data to the filter worker.',
      );
      setIsFiltering(false);
    }
  }, [enabled, records, filterGroup]);

  return {
    filteredRecords,
    isFiltering: enabled && isFiltering,
    error: enabled ? error : null,
  };
}

export type { FilterNode };
