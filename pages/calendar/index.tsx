import { useEffect, useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, type Event } from 'react-big-calendar';
import { addDays, format, getDay, parse, startOfWeek } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useSelector } from 'react-redux';
import { getChangeRequests } from '../../api/reporting.api';
import { isDemoMode } from '../../config/api.config';
import type { ChangeRequestRecord } from '../../types/reporting.types';
import type { RootState } from '../../store';

interface MilestoneEvent extends Event {
  resource: ChangeRequestRecord;
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { 'en-US': enUS },
});

function toMilestone(record: ChangeRequestRecord): MilestoneEvent | null {
  const dateValue = record.slaDueDate;
  if (typeof dateValue !== 'string' || !dateValue) return null;

  const dueDate = new Date(dateValue);
  if (Number.isNaN(dueDate.getTime())) return null;
  const isOpen = !['APPROVED', 'DEPLOYED'].includes(
    String(record.status).toUpperCase(),
  );
  const isBreached = dueDate < new Date() && isOpen;

  return {
    title: `${isBreached ? 'SLA BREACH' : 'SLA due'}: ${record.title}`,
    start: dueDate,
    end: addDays(dueDate, 1),
    allDay: true,
    resource: record,
  };
}

export default function CalendarPage() {
  const cachedRecords = useSelector((state: RootState) => state.reporting.records);
  const [loadedRecords, setLoadedRecords] = useState<ChangeRequestRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const records = cachedRecords.length > 0 ? cachedRecords : loadedRecords;

  useEffect(() => {
    if (cachedRecords.length > 0) return;
    let active = true;
    getChangeRequests()
      .then((data) => {
        if (active) setLoadedRecords(data);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load calendar milestones.',
          );
        }
      });
    return () => {
      active = false;
    };
  }, [cachedRecords.length]);

  const events = useMemo(
    () =>
      records
        .map(toMilestone)
        .filter((event): event is MilestoneEvent => event !== null),
    [records],
  );

  return (
    <section>
      <h1>Change request calendar</h1>
      <p>Change request SLA due dates and milestone alerts.</p>
      {isDemoMode && (
        <p role="status">
          Demo mode: sample change requests are stored in this browser.
        </p>
      )}
      {error && <p role="alert">Unable to load calendar: {error}</p>}
      <div style={{ height: 680 }}>
        <Calendar<MilestoneEvent>
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          style={{ height: '100%' }}
          eventPropGetter={(event) => {
            const dueDate = new Date(event.resource.slaDueDate);
            const isOpen = !['APPROVED', 'DEPLOYED'].includes(
              String(event.resource.status).toUpperCase(),
            );
            const isBreached = dueDate < new Date() && isOpen;
            return {
              style: {
                backgroundColor: isBreached ? '#b91c1c' : '#1d4ed8',
                borderColor: isBreached ? '#991b1b' : '#1e40af',
              },
            };
          }}
          popup
        />
      </div>
    </section>
  );
}
