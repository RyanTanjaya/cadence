import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Habit, HabitDraft } from '../types';

export const HABITS_KEY = ['habits'] as const;

export function useHabits() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: async () => (await api.get<Habit[]>('/api/habits')).data,
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (draft: HabitDraft) => (await api.post<Habit>('/api/habits', draft)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Habit> }) =>
      (await api.put<Habit>(`/api/habits/${id}`, patch)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/habits/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useReorderHabits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: string[]) => {
      await api.post('/api/habits/reorder', { order });
    },
    onMutate: async (order) => {
      await qc.cancelQueries({ queryKey: HABITS_KEY });
      const prev = qc.getQueryData<Habit[]>(HABITS_KEY);
      if (prev) {
        const byId = new Map(prev.map((h) => [h.id, h]));
        const reordered = order.map((id) => byId.get(id)!).filter(Boolean);
        qc.setQueryData<Habit[]>(HABITS_KEY, reordered);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABITS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

export function useSeedDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/api/habits/demo');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}

/** Optimistic completion toggle for instant ring fill. */
export function useToggleCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date, done }: { id: string; date: string; done: boolean }) => {
      if (done) await api.post(`/api/habits/${id}/completions/${date}`);
      else await api.delete(`/api/habits/${id}/completions/${date}`);
    },
    onMutate: async ({ id, date, done }) => {
      await qc.cancelQueries({ queryKey: HABITS_KEY });
      const prev = qc.getQueryData<Habit[]>(HABITS_KEY);
      qc.setQueryData<Habit[]>(HABITS_KEY, (old) =>
        old?.map((h) => {
          if (h.id !== id) return h;
          const set = new Set(h.completions);
          if (done) set.add(date);
          else set.delete(date);
          return { ...h, completions: [...set].sort() };
        }),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(HABITS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HABITS_KEY }),
  });
}
