import { EMOJI_OPTIONS } from '../../lib/palette';

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: Props) {
  return (
    <div className="field">
      <span className="field__label">Choose an icon</span>
      <div className="emoji-grid" role="radiogroup" aria-label="Habit icon">
        {EMOJI_OPTIONS.map((emoji) => {
          const selected = emoji === value;
          return (
            <button
              key={emoji}
              type="button"
              className={`emoji-option ${selected ? 'emoji-option--selected' : ''}`}
              onClick={() => onChange(emoji)}
              role="radio"
              aria-checked={selected}
              aria-label={emoji}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}
