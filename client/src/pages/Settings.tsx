import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/layout/ThemeToggle';
import { Button } from '../components/ui/button';
import { useDeleteHabit, useHabits, useSeedDemo, useUpdateHabit } from '../hooks/useHabits';
import { useAuth } from '../store/useAuth';

export default function Settings() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: habits } = useHabits();
  const seedDemo = useSeedDemo();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const archived = (habits ?? []).filter((h) => h.isArchived);
  const isEmpty = (habits ?? []).length === 0;

  function signOut() {
    logout();
    qc.clear();
    navigate('/login', { replace: true });
  }

  return (
    <div className="page">
      <header className="page__header">
        <div className="eyebrow">Settings</div>
        <h1 className="page__title">Make it yours</h1>
        <p className="page__subtitle">Account, appearance, and how Cadence behaves.</p>
      </header>

      <section className="settings-group">
        <div className="settings-group__title">Account</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">{user?.name ?? 'Your account'}</div>
              <div className="settings-row__desc">{user?.email}</div>
            </div>
            <div className="settings-row__control">
              <Button variant="outline" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group__title">Appearance</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Theme</div>
              <div className="settings-row__desc">Switch between light and dark.</div>
            </div>
            <div className="settings-row__control" style={{ width: 200 }}>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group__title">Preferences</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Week starts on Monday</div>
              <div className="settings-row__desc">
                Streaks, heatmaps, and weekly recaps all run Monday → Sunday.
              </div>
            </div>
            <div className="settings-row__control">
              <span className="streak-badge">Default</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Grace days</div>
              <div className="settings-row__desc">
                One missed day per rolling week never breaks a streak. Flexibility by design.
              </div>
            </div>
            <div className="settings-row__control">
              <span className="streak-badge">1 / week</span>
            </div>
          </div>
        </div>
      </section>

      {archived.length > 0 && (
        <section className="settings-group">
          <div className="settings-group__title">Archived habits</div>
          <div className="settings-card">
            {archived.map((habit) => (
              <div className="settings-row" key={habit.id}>
                <div className="settings-row__text" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '1.2rem' }}>{habit.emoji}</span>
                  <span className="settings-row__label">{habit.name}</span>
                </div>
                <div className="settings-row__control" style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateHabit.mutate({ id: habit.id, patch: { isArchived: false } })}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Permanently delete "${habit.name}" and its history?`)) {
                        deleteHabit.mutate(habit.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="settings-group">
        <div className="settings-group__title">Data</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Load demo data</div>
              <div className="settings-row__desc">
                Populate your account with five sample habits and ~3 months of history.
                {!isEmpty && ' This replaces your current habits.'}
              </div>
            </div>
            <div className="settings-row__control">
              <Button
                variant="secondary"
                size="sm"
                disabled={seedDemo.isPending}
                onClick={() => {
                  if (isEmpty || confirm('Replace your current habits with the demo set?')) {
                    seedDemo.mutate();
                  }
                }}
              >
                {seedDemo.isPending ? 'Loading…' : 'Load demo data'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group__title">About</div>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__text">
              <div className="settings-row__label">Cadence</div>
              <div className="settings-row__desc">
                A habit tracker built around your rhythm — completion rings, flexible streaks, and
                real progress over empty points.
              </div>
            </div>
            <div className="settings-row__control muted" style={{ fontSize: '0.85rem' }}>
              v1.0
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
