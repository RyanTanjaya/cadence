import {
  addDays,
  differenceInCalendarDays,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns';

/** Weeks start on Monday throughout Cadence. */
export const WEEK_OPTS = { weekStartsOn: 1 as const };

/** Canonical storage key for a calendar day: `yyyy-MM-dd`. */
export function dateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Parse a `yyyy-MM-dd` key back into a local Date. */
export function fromKey(key: string): Date {
  return parseISO(key);
}

export function today(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function todayKey(): string {
  return dateKey(today());
}

export function isFuture(date: Date): boolean {
  return differenceInCalendarDays(date, today()) > 0;
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayIndex(date: Date): number {
  return date.getDay();
}

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
/** Mon-first ordering used by the weekday selector. */
export const WEEKDAY_ORDER_MON_FIRST = [1, 2, 3, 4, 5, 6, 0];

export {
  addDays,
  subDays,
  isSameDay,
  startOfWeek,
  endOfWeek,
  differenceInCalendarDays,
  format,
};
