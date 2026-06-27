interface Props {
  streak: number;
}

export default function StreakBadge({ streak }: Props) {
  if (streak <= 0) {
    return (
      <span className="streak-badge streak-badge--zero">Start today</span>
    );
  }

  const hot = streak >= 7;
  return (
    <span className={`streak-badge ${hot ? 'streak-badge--hot' : ''}`}>
      <span className="streak-badge__flame">{hot ? '🔥' : '✓'}</span>
      <span className="streak-badge__num">
        {streak} day{streak === 1 ? '' : 's'}
      </span>
    </span>
  );
}
