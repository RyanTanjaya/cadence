import type { CSSProperties } from 'react';
import { SWATCHES } from '../../lib/palette';
import { Check } from '../icons';

interface Props {
  value: string;
  onChange: (color: string) => void;
}

export default function ColorSwatches({ value, onChange }: Props) {
  return (
    <div className="field">
      <span className="field__label">Ring color</span>
      <div className="swatches" role="radiogroup" aria-label="Ring color">
        {SWATCHES.map(({ name, value: color }) => {
          const selected = color === value;
          return (
            <button
              key={color}
              type="button"
              className={`swatch ${selected ? 'swatch--selected' : ''}`}
              style={{ background: color, color } as CSSProperties}
              onClick={() => onChange(color)}
              role="radio"
              aria-checked={selected}
              aria-label={name}
              title={name}
            >
              {selected && <Check size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
