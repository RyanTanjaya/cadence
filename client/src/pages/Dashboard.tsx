import { AnimatePresence, motion } from 'framer-motion';
import { isMonday } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import AddHabitButton from '../components/dashboard/AddHabitButton';
import AllDoneBanner from '../components/dashboard/AllDoneBanner';
import DateNavigator from '../components/dashboard/DateNavigator';
import DaySummary from '../components/dashboard/DaySummary';
import EmptyState from '../components/dashboard/EmptyState';
import SortableRingGrid from '../components/dashboard/SortableRingGrid';
import WeeklyRevealBanner from '../components/banner/WeeklyRevealBanner';
import AddHabitDialog from '../components/dialog/AddHabitDialog';
import type { Habit } from '../types';
import {
  useCreateHabit,
  useHabits,
  useReorderHabits,
  useToggleCompletion,
} from '../hooks/useHabits';
import { dateKey, isSameDay, today } from '../lib/date';
import { isCompleted, isDueOn, weeklyReveal } from '../lib/habit';
import { celebrate } from '../lib/confetti';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still going.';
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  if (h < 22) return 'Good evening.';
  return 'Winding down.';
}

const DISMISSED_KEY = 'cadence-dismissed-weeks';

export default function Dashboard() {
  const { data, isLoading } = useHabits();
  const habits = useMemo(() => data ?? [], [data]);
  const toggle = useToggleCompletion();
  const createHabit = useCreateHabit();
  const reorder = useReorderHabits();

  const [date, setDate] = useState(() => today());
  const [adding, setAdding] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
    } catch {
      return [];
    }
  });

  function dismissWeek(weekKey: string) {
    setDismissed((prev) => {
      const next = prev.includes(weekKey) ? prev : [...prev, weekKey];
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
      return next;
    });
  }

  const active = habits.filter((h) => !h.isArchived);
  const due = active.filter((h) => isDueOn(h, date));
  const key = dateKey(date);
  const doneCount = due.filter((h) => isCompleted(h, date)).length;
  const allDone = due.length > 0 && doneCount === due.length;
  const viewingToday = isSameDay(date, today());

  const reveal = useMemo(() => weeklyReveal(habits), [habits]);
  const showReveal =
    isMonday(today()) && reveal.possible > 0 && !dismissed.includes(reveal.weekKey);

  // Fire confetti the moment every ring closes (today only, not on first load).
  const prevAllDone = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current && viewingToday && allDone && !prevAllDone.current) {
      celebrate();
    }
    prevAllDone.current = allDone;
    mounted.current = true;
  }, [allDone, viewingToday]);

  function onToggle(id: string) {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    toggle.mutate({ id, date: key, done: !habit.completions.includes(key) });
  }

  // Reordering the visible (due) cards persists the full habit order: due
  // habits take their new relative order within their original slots.
  function onReorder(newDue: Habit[]) {
    const dueIds = new Set(newDue.map((h) => h.id));
    let di = 0;
    const fullOrder = active.map((h) => (dueIds.has(h.id) ? newDue[di++].id : h.id));
    reorder.mutate(fullOrder);
  }

  if (isLoading) {
    return (
      <div className="page grid place-items-center" style={{ minHeight: '60vh' }}>
        <Loader2 className="animate-spin text-ink-3" size={28} />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page__header">
        <div className="eyebrow">
          Today · {due.length > 0 ? `${doneCount}/${due.length} closed` : 'Dashboard'}
        </div>
        <h1 className="page__title">{greeting()}</h1>
        <p className="page__subtitle">
          {active.length === 0
            ? 'Your rhythm starts with a single habit.'
            : allDone
              ? 'Every ring is closed. Savor it.'
              : `${due.length - doneCount} habit${due.length - doneCount === 1 ? '' : 's'} left to close.`}
        </p>
      </header>

      <DateNavigator date={date} onChange={setDate} />

      {due.length > 0 && !allDone && (
        <DaySummary habits={due} date={date} isToday={viewingToday} />
      )}

      <AnimatePresence>
        {showReveal && (
          <WeeklyRevealBanner reveal={reveal} onDismiss={() => dismissWeek(reveal.weekKey)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {allDone && <AllDoneBanner count={due.length} isToday={viewingToday} />}
      </AnimatePresence>

      {active.length === 0 ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : due.length === 0 ? (
        <motion.div className="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="empty__emoji" style={{ fontSize: '2.4rem' }}>🌙</div>
          <h2 className="empty__title" style={{ fontSize: '1.4rem', marginTop: 12 }}>
            A rest day
          </h2>
          <p className="empty__text">Nothing is scheduled for this day. Recover and come back strong.</p>
        </motion.div>
      ) : (
        <SortableRingGrid habits={due} date={date} onToggle={onToggle} onReorder={onReorder} />
      )}

      {active.length > 0 && <AddHabitButton onClick={() => setAdding(true)} />}

      <AnimatePresence>
        {adding && (
          <AddHabitDialog
            onClose={() => setAdding(false)}
            onSave={(draft) => {
              createHabit.mutate(draft);
              setAdding(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
