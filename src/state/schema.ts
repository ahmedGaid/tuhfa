/** Learner state `tuhfa:v1` (data-model.md "Learner state"; contract progress-storage.md). */
import { z } from 'zod';

export const VERSION = 1;

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const Count = z.number().int().min(0);

export const SettingsSchema = z.object({
  goal: z.union([z.literal(20), z.literal(50), z.literal(100)]),
  sound: z.boolean(),
  teacher: z.boolean(),
  theme: z.enum(['auto', 'light', 'dark']),
});
export type Settings = z.infer<typeof SettingsSchema>;
export type Goal = Settings['goal'];
export type Theme = Settings['theme'];

export const ProgressSchema = z.object({
  version: z.literal(VERSION),
  /** key = moduleId/lessonId */
  lessons: z.record(
    z.string(),
    z.object({
      stars: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      best: z.number().min(0).max(1),
      done: Day,
    }),
  ),
  xp: z.object({ total: Count, byDay: z.record(Day, Count) }),
  streak: z.object({ count: Count, lastDay: Day.nullable() }),
  /** key = moduleId/conceptId */
  srs: z.record(z.string(), z.object({ box: z.number().int().min(1).max(5), due: Day, wrong: Count })),
  /** moduleId/conceptId, most recent first, unique */
  mistakes: z.array(z.string()),
  settings: SettingsSchema,
  seenWelcome: z.boolean(),
});
export type Progress = z.infer<typeof ProgressSchema>;

export const freshProgress = (): Progress => ({
  version: VERSION,
  lessons: {},
  xp: { total: 0, byDay: {} },
  streak: { count: 0, lastDay: null },
  srs: {},
  mistakes: [],
  settings: { goal: 20, sound: true, teacher: false, theme: 'auto' },
  seenWelcome: false,
});

/** `migrations[n]` turns a version-n state into version n+1. Empty while v1 is the only version. */
export const migrations: Record<number, (state: Record<string, unknown>) => Record<string, unknown>> = {};
