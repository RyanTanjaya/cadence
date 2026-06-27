interface Props {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
}

export default function HabitNameInput({ value, onChange, onEnter }: Props) {
  return (
    <div className="field">
      <label className="field__label" htmlFor="habit-name">
        What do you want to build?
      </label>
      <input
        id="habit-name"
        className="name-input"
        type="text"
        value={value}
        maxLength={40}
        placeholder="e.g. Meditate, Read, Stretch…"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onEnter?.();
        }}
        autoComplete="off"
        autoFocus
      />
    </div>
  );
}
