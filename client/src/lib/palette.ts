/** The 8 preset ring colors offered in the add/edit dialog. */
export const SWATCHES = [
  { name: 'Coral', value: '#FF6B6B' },
  { name: 'Amber', value: '#F4A261' },
  { name: 'Gold', value: '#E9C46A' },
  { name: 'Sage', value: '#2A9D8F' },
  { name: 'Ocean', value: '#4D7CFE' },
  { name: 'Iris', value: '#7C5CFC' },
  { name: 'Rose', value: '#E5739D' },
  { name: 'Slate', value: '#64748B' },
] as const;

export const DEFAULT_COLOR = SWATCHES[5].value;

/** Curated emoji set for the picker, grouped loosely by theme. */
export const EMOJI_OPTIONS = [
  '🧘', '🏃', '📚', '💧', '🎸', '🥗', '🏋️', '🚴',
  '🧠', '✍️', '🎨', '🧹', '🌱', '☀️', '🌙', '🛌',
  '🦷', '💊', '🚭', '🍎', '🥦', '☕', '💻', '📝',
  '🎯', '🙏', '❤️', '🔥', '⭐', '🎹', '📷', '🐶',
];

export const DEFAULT_EMOJI = '✨';
