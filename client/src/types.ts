/**
 * Frequency is stored as a string (matches the API + shared streakLogic):
 *   "daily" | "weekly:N" | "weekdays:1,3,5"
 */
export type Frequency = string;

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  /** Hex color used for the completion ring + accents. */
  color: string;
  frequency: Frequency;
  graceDays: number;
  sortOrder: number;
  isArchived: boolean;
  /** ISO date key (yyyy-MM-dd) the habit was created. */
  createdAt: string;
  /** Completed calendar-day keys (yyyy-MM-dd). */
  completions: string[];
}

/** A draft used by the add/edit dialog before it becomes a Habit. */
export interface HabitDraft {
  name: string;
  emoji: string;
  color: string;
  frequency: Frequency;
  graceDays: number;
}

export type ThemeName = 'light' | 'dark';
