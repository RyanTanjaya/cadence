import { motion } from 'framer-motion';
import { Plus } from '../icons';

interface Props {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: Props) {
  return (
    <motion.div
      className="empty"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="empty__art">
        <svg viewBox="0 0 120 120" width="130" height="130" fill="none" aria-hidden>
          <circle cx="60" cy="60" r="46" stroke="var(--ring-track)" strokeWidth="11" />
          <motion.circle
            cx="60"
            cy="60"
            r="46"
            stroke="#7C5CFC"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 46}
            initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 46 * 0.35 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            style={{ transformOrigin: '60px 60px', transform: 'rotate(-90deg)' }}
          />
        </svg>
        <span className="empty__emoji" style={{ position: 'absolute' }}>
          🌱
        </span>
      </div>

      <h2 className="empty__title">Plant your first habit</h2>
      <p className="empty__text">
        Cadence is built around your rhythm — daily, a few times a week, or on
        the days that suit you. Add a habit and start closing rings.
      </p>
      <button type="button" className="btn btn--primary btn--lg" onClick={onAdd}>
        <Plus size={19} />
        Create a habit
      </button>
    </motion.div>
  );
}
