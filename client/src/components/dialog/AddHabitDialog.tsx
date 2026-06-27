import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Habit, HabitDraft } from '../../types';
import { frequencyLabel } from '../../lib/frequency';
import { parseFrequency } from '../../lib/streakLogic';
import { DEFAULT_COLOR, DEFAULT_EMOJI } from '../../lib/palette';
import CompletionRing from '../dashboard/CompletionRing';
import { Trash, X } from '../icons';
import ColorSwatches from './ColorSwatches';
import EmojiPicker from './EmojiPicker';
import FrequencySelector from './FrequencySelector';
import HabitNameInput from './HabitNameInput';

interface Props {
  habit?: Habit | null;
  onClose: () => void;
  onSave: (draft: HabitDraft) => void;
  onDelete?: (id: string) => void;
}

export default function AddHabitDialog({ habit, onClose, onSave, onDelete }: Props) {
  const editing = Boolean(habit);
  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? DEFAULT_EMOJI);
  const [color, setColor] = useState(habit?.color ?? DEFAULT_COLOR);
  const [frequency, setFrequency] = useState<string>(habit?.frequency ?? 'daily');
  const [graceDays] = useState<number>(habit?.graceDays ?? 1);

  const parsedFreq = parseFrequency(frequency);
  const invalidWeekdays = parsedFreq.kind === 'weekdays' && parsedFreq.days.length === 0;
  const canSave = name.trim().length > 0 && !invalidWeekdays;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  function handleSave() {
    if (!canSave) return;
    onSave({ name: name.trim(), emoji, color, frequency, graceDays });
  }

  return (
    <motion.div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="dialog"
        style={{ '--habit': color } as CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Edit habit' : 'New habit'}
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
      >
        <div className="dialog__header">
          <h2 className="dialog__title">{editing ? 'Edit habit' : 'New habit'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X />
          </button>
        </div>

        <div className="dialog__body">
          <div className="dialog__preview">
            <div className="dialog__preview-ring">
              <CompletionRing progress={1} size={66} strokeWidth={6} />
              <span className="dialog__preview-emoji">{emoji}</span>
            </div>
            <div>
              <div className="dialog__preview-name">{name.trim() || 'Your new habit'}</div>
              <div className="dialog__preview-freq">{frequencyLabel(frequency)}</div>
            </div>
          </div>

          <HabitNameInput value={name} onChange={setName} onEnter={handleSave} />
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <ColorSwatches value={color} onChange={setColor} />
          <FrequencySelector value={frequency} onChange={setFrequency} />
        </div>

        <div className="dialog__footer">
          {editing && onDelete && habit && (
            <button
              type="button"
              className="btn btn--danger"
              onClick={() => onDelete(habit.id)}
              aria-label="Delete habit"
            >
              <Trash size={17} />
              Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSave}
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.5, pointerEvents: canSave ? 'auto' : 'none' }}
          >
            {editing ? 'Save changes' : 'Create habit'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
