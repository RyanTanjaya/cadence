import { motion } from 'framer-motion';
import { Plus } from '../icons';

interface Props {
  onClick: () => void;
}

export default function AddHabitButton({ onClick }: Props) {
  return (
    <motion.button
      type="button"
      className="add-fab"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 24, delay: 0.2 }}
      aria-label="Add a new habit"
    >
      <span className="add-fab__plus">
        <Plus size={22} />
      </span>
      <span className="add-fab__label">New habit</span>
    </motion.button>
  );
}
