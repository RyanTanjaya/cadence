import type { CSSProperties } from 'react';
import type { Habit } from '../../types';
import { buildHeatmap } from '../../lib/habit';
import { format } from '../../lib/date';

interface Props {
  habit: Habit;
  weeks?: number;
}

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export default function HeatmapCalendar({ habit, weeks = 12 }: Props) {
  const columns = buildHeatmap(habit, weeks);

  // One month label per column, shown when the month changes.
  let lastMonth = -1;
  const monthLabels = columns.map((col) => {
    const month = col[0].date.getMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      return format(col[0].date, 'MMM');
    }
    return '';
  });

  return (
    <div className="heatmap" style={{ '--habit': habit.color } as CSSProperties}>
      <div className="heatmap__inner">
        <div className="heatmap__months">
          {monthLabels.map((label, i) => (
            <span key={i} style={{ width: 14, marginRight: 3, display: 'inline-block' }}>
              {label}
            </span>
          ))}
        </div>

        <div className="heatmap__body">
          <div className="heatmap__weekdays">
            {WEEKDAY_LABELS.map((label, i) => (
              <span className="heatmap__weekday" key={i}>
                {label}
              </span>
            ))}
          </div>

          <div className="heatmap__grid">
            {columns.map((col, ci) => (
              <div className="heatmap__col" key={ci}>
                {col.map((cell) => {
                  let cls = 'heatmap__cell';
                  if (!cell.inRange) cls += ' heatmap__cell--empty';
                  else if (cell.done) cls += ' heatmap__cell--done';
                  else if (cell.due) cls += ' heatmap__cell--miss';
                  else cls += ' heatmap__cell--off';
                  if (cell.isToday) cls += ' heatmap__cell--today';

                  const title = cell.inRange
                    ? `${format(cell.date, 'EEE, MMM d')} · ${cell.done ? 'Done' : cell.due ? 'Missed' : 'Rest day'}`
                    : format(cell.date, 'EEE, MMM d');

                  return <div className={cls} key={cell.key} title={title} />;
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="heatmap__legend">
          <span>Skipped</span>
          <span className="heatmap__legend-cells">
            <span className="heatmap__legend-cell" style={{ background: 'var(--ring-track)' }} />
            <span
              className="heatmap__legend-cell"
              style={{ background: 'color-mix(in srgb, var(--habit) 45%, var(--ring-track))' }}
            />
            <span className="heatmap__legend-cell" style={{ background: 'var(--habit)' }} />
          </span>
          <span>Done</span>
        </div>
      </div>
    </div>
  );
}
