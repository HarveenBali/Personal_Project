'use client';

import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChangeRequestRecord } from '../../features/reporting/reportingSlice';

export interface SlaBreachPoint {
  date: string;
  breaches: number;
}

interface ReportAnalyticsChartsProps {
  records: ChangeRequestRecord[];
  slaBreaches?: SlaBreachPoint[];
}

const priorityOrder = ['Low', 'Medium', 'High', 'Critical', 'Unknown'];

function normalizeCategory(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function ReportAnalyticsCharts({
  records,
  slaBreaches = [],
}: ReportAnalyticsChartsProps) {
  const { chartData, statuses } = useMemo(() => {
    const counts = new Map<string, Record<string, string | number>>();
    const statusSet = new Set<string>();

    for (const record of records) {
      const priority = normalizeCategory(record.priority, 'Unknown');
      const status = normalizeCategory(record.status, 'Unknown');
      statusSet.add(status);
      const row = counts.get(priority) ?? { priority };
      row[status] = Number(row[status] ?? 0) + 1;
      counts.set(priority, row);
    }

    const sortedPriorities = [...counts.keys()].sort((left, right) => {
      const leftIndex = priorityOrder.indexOf(left);
      const rightIndex = priorityOrder.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) {
        return left.localeCompare(right);
      }
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });

    return {
      chartData: sortedPriorities.map((priority) => counts.get(priority)!),
      statuses: [...statusSet].sort(),
    };
  }, [records]);

  return (
    <section aria-label="Report analytics">
      <article aria-label="Change request priority breakdown by status">
        <h2>Change request priority by status</h2>
        {chartData.length === 0 ? (
          <p>No change request records available.</p>
        ) : (
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {statuses.map((status, index) => (
                  <Bar
                    key={status}
                    dataKey={status}
                    stackId="requests"
                    fill={`hsl(${(index * 67 + 210) % 360} 65% 48%)`}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>

      <article aria-label="SLA breaches over time">
        <h2>SLA breaches over time</h2>
        {slaBreaches.length === 0 ? (
          <p>No dated SLA breach data available.</p>
        ) : (
          <div style={{ height: 320, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaBreaches} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="breaches"
                  name="SLA breaches"
                  stroke="#dc2626"
                  strokeWidth={2}
                  dot
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </article>
    </section>
  );
}
