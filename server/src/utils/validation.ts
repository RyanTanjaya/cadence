import { z } from 'zod';

/** 'daily' | 'weekly:N' (1–7) | 'weekdays:csv of 0–6'. */
export const frequencySchema = z.string().refine(
  (value) => {
    if (value === 'daily') return true;
    if (/^weekly:[1-7]$/.test(value)) return true;
    if (/^weekdays:(?:[0-6])(?:,[0-6])*$/.test(value)) {
      const days = value.slice('weekdays:'.length).split(',').map(Number);
      return days.length > 0 && new Set(days).size === days.length;
    }
    return false;
  },
  { message: "frequency must be 'daily', 'weekly:N', or 'weekdays:0,1,...'" },
);

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  email: z.string().trim().toLowerCase().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
});

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  emoji: z.string().trim().min(1).max(8).default('⭐'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a hex value').default('#8b5cf6'),
  frequency: frequencySchema.default('daily'),
  graceDays: z.number().int().min(0).max(3).default(1),
});

export const updateHabitSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    emoji: z.string().trim().min(1).max(8),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    frequency: frequencySchema,
    graceDays: z.number().int().min(0).max(3),
    sortOrder: z.number().int(),
    isArchived: z.boolean(),
  })
  .partial();

export const reorderSchema = z.object({
  order: z.array(z.string()).min(1),
});

export const journalEntrySchema = z.object({
  text: z.string().max(20000),
  prompt: z.string().max(500).default(''),
  reflection: z.string().max(8000).optional(),
});

export const reflectSchema = z.object({
  text: z.string().trim().min(1).max(20000),
  prompt: z.string().max(500).default(''),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
