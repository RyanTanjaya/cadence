import { useTheme } from '../../store/useTheme';
import { Moon, Sun } from '../icons';

export default function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        type="button"
        className={`theme-toggle__opt ${theme === 'light' ? 'theme-toggle__opt--active' : ''}`}
        onClick={() => setTheme('light')}
        aria-pressed={theme === 'light'}
      >
        <Sun size={15} />
        Light
      </button>
      <button
        type="button"
        className={`theme-toggle__opt ${theme === 'dark' ? 'theme-toggle__opt--active' : ''}`}
        onClick={() => setTheme('dark')}
        aria-pressed={theme === 'dark'}
      >
        <Moon size={15} />
        Dark
      </button>
    </div>
  );
}
