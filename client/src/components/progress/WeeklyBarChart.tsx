import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Habit } from '../../types';
import { addDays, dateKey, format, subDays, today } from '../../lib/date';

interface Props {
  habits: Habit[];
  days?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip(props: any) {
  if (!props?.active || !props?.payload?.length) return null;
  const point = props.payload[0].payload;
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        padding: '8px 12px',
        fontSize: 12,
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ fontWeight: 600, color: 'var(--ink-2)' }}>{point.label}</div>
      <div style={{ color: 'var(--ink-3)' }}>{point.count} completed</div>
    </div>
  );
}

export default function WeeklyBarChart({ habits, days = 28 }: Props) {
  const start = subDays(today(), days - 1);
  const data = Array.from({ length: days }, (_, i) => {
    const d = addDays(start, i);
    const key = dateKey(d);
    const count = habits.reduce((n, h) => n + (h.completions.includes(key) ? 1 : 0), 0);
    return { label: format(d, 'MMM d'), tick: format(d, 'd'), count };
  });

  return (
    <div className="settings-card" style={{ padding: '18px 16px 10px' }}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
          <defs>
            <linearGradient id="cd-bar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#b09bff" />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="tick"
            interval={6}
            tick={{ fontSize: 10, fill: 'var(--ink-3)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            width={28}
            tick={{ fontSize: 10, fill: 'var(--ink-3)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: 'var(--surface-2)' }} content={<ChartTooltip />} />
          <Bar dataKey="count" radius={[5, 5, 0, 0]} fill="url(#cd-bar)" maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
