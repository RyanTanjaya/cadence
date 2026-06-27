import { WEEKDAY_INITIALS, WEEKDAY_ORDER_MON_FIRST } from '../../lib/date';
import { parseFrequency } from '../../lib/streakLogic';

interface Props {
  value: string;
  onChange: (frequency: string) => void;
}

type Kind = 'daily' | 'weekly' | 'weekdays';

const SEGMENTS: { kind: Kind; label: string }[] = [
  { kind: 'daily', label: 'Every day' },
  { kind: 'weekly', label: 'Times / week' },
  { kind: 'weekdays', label: 'Specific days' },
];

const PRESETS: { label: string; days: number[] }[] = [
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
];

function weekdaysStr(days: number[]): string {
  return `weekdays:${[...days].sort((a, b) => a - b).join(',')}`;
}

export default function FrequencySelector({ value, onChange }: Props) {
  const parsed = parseFrequency(value);
  const kind = parsed.kind;
  const selectedDays = parsed.kind === 'weekdays' ? parsed.days : [];

  function selectKind(next: Kind) {
    if (next === kind) return;
    if (next === 'daily') onChange('daily');
    if (next === 'weekly') onChange(`weekly:${parsed.kind === 'weekly' ? parsed.target : 4}`);
    if (next === 'weekdays') {
      const days = parsed.kind === 'weekdays' && parsed.days.length ? parsed.days : [1, 2, 3, 4, 5];
      onChange(weekdaysStr(days));
    }
  }

  function toggleDay(day: number) {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    onChange(weekdaysStr(next));
  }

  return (
    <div className="field">
      <span className="field__label">How often?</span>

      <div className="seg" role="tablist" aria-label="Frequency type">
        {SEGMENTS.map(({ kind: k, label }) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            className={`seg__opt ${kind === k ? 'seg__opt--active' : ''}`}
            onClick={() => selectKind(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {kind === 'weekly' && (
        <div className="freq-extra">
          <div className="count-row">
            {[3, 4, 5, 6].map((n) => {
              const active = parsed.kind === 'weekly' && parsed.target === n;
              return (
                <button
                  key={n}
                  type="button"
                  className={`count-chip ${active ? 'count-chip--active' : ''}`}
                  onClick={() => onChange(`weekly:${n}`)}
                  aria-pressed={active}
                >
                  <span className="count-chip__num">{n}×</span>
                  <span className="count-chip__label">per week</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {kind === 'weekdays' && (
        <div className="freq-extra">
          <div className="weekday-row">
            {WEEKDAY_ORDER_MON_FIRST.map((day) => (
              <button
                key={day}
                type="button"
                className={`weekday-toggle ${selectedDays.includes(day) ? 'weekday-toggle--on' : ''}`}
                onClick={() => toggleDay(day)}
                aria-pressed={selectedDays.includes(day)}
                aria-label={`Toggle ${WEEKDAY_INITIALS[day]}`}
              >
                {WEEKDAY_INITIALS[day]}
              </button>
            ))}
          </div>
          <div className="weekday-presets">
            {PRESETS.map(({ label, days }) => (
              <button
                key={label}
                type="button"
                className="preset-chip"
                onClick={() => onChange(weekdaysStr(days))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
