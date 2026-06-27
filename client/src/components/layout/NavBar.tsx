import { NavLink } from 'react-router-dom';
import { ChartIcon, SettingsIcon, TodayIcon } from '../icons';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { to: '/', label: 'Today', Icon: TodayIcon, end: true },
  { to: '/progress', label: 'Progress', Icon: ChartIcon, end: false },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon, end: false },
];

function BrandMark() {
  return (
    <svg className="nav__brand-mark" viewBox="0 0 36 36" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="13" stroke="var(--ring-track)" strokeWidth="4" />
      <path
        d="M18 5a13 13 0 0 1 12.26 8.68"
        stroke="#F4A261"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M30.26 13.68A13 13 0 1 1 8.7 9.2"
        stroke="#2A9D8F"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NavBar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="nav" aria-label="Primary">
        <div className="nav__brand">
          <BrandMark />
          <span className="nav__brand-text">Cadence</span>
        </div>

        <nav className="nav__links">
          {LINKS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav__link ${isActive ? 'nav__link--active' : ''}`
              }
            >
              <span className="nav__link-icon">
                <Icon size={21} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="nav__footer">
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="tabbar" aria-label="Primary">
        {LINKS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `tabbar__link ${isActive ? 'tabbar__link--active' : ''}`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
