import { parseFrequency } from './streakLogic';
import { WEEKDAY_LABELS } from './date';

/** Human-readable summary of a frequency string, e.g. "4× per week". */
export function frequencyLabel(freq: string): string {
  const p = parseFrequency(freq);
  if (p.kind === 'daily') return 'Every day';
  if (p.kind === 'weekly') return `${p.target}× per week`;

  const days = [...p.days].sort((a, b) => a - b);
  if (days.length === 0) return 'No days set';
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Weekdays';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  const ordered = [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d));
  return ordered.map((d) => WEEKDAY_LABELS[d]).join(' · ');
}

/** Short tagline shown under habit cards / rows. */
export function frequencyTagline(freq: string): string {
  const p = parseFrequency(freq);
  if (p.kind === 'daily') return 'Daily';
  if (p.kind === 'weekly') return `${p.target}×/week`;
  return frequencyLabel(freq);
}
