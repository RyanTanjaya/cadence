import { Trophy } from '../icons';

interface Props {
  label?: string;
}

/** Subtle gold "PR" chip highlighting a personal best. */
export default function PersonalRecordBadge({ label = 'PR' }: Props) {
  return (
    <span className="pr-badge" title="Personal record">
      <Trophy size={11} />
      {label}
    </span>
  );
}
