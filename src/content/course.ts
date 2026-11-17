/**
 * The course path: one entry per باب, in the Sheikh's order.
 *
 * Order is PROVISIONAL (research R15) — taken from the numbering of the Sheikh's PDF chapters until
 * the founder confirms it. Reordering = moving entries here; nothing else changes.
 * Titles of «قريبًا» chapters are the Sheikh's PDF chapter titles. Icons are placeholders
 * (the chapter's key letter) until each chapter is built.
 */
import { CourseSchema, type Course } from './schema.ts';

export const course: Course = CourseSchema.parse({
  modules: [
    { id: 'mabadi', title: 'مبادئ علم التجويد وبعض المقدمات', icon: 'ت', status: 'soon' },
    { id: 'noon-sakinah', title: 'أحكام النون الساكنة والتنوين', icon: 'نْ', status: 'soon' },
    { id: 'ghunnah', title: 'الغنة', icon: 'غ', status: 'soon' },
    { id: 'meem-sakinah', title: 'أحكام الميم الساكنة', icon: 'مْ', status: 'soon' },
    { id: 'lamat', title: 'أحكام اللامات', icon: 'ل', status: 'soon' },
    {
      id: 'madd',
      title: 'أحكام المد والقصر',
      icon: 'ا',
      // same pair as --cat-asli in src/ui/theme.css (validate checks they stay equal)
      color: { light: '#b07400', dark: '#f2b84b' },
      status: 'ready',
      load: () => import('./modules/madd/index.ts'),
    },
    {
      id: 'mithlan',
      title: 'المثلان والمتقاربان والمتجانسان',
      icon: 'ث',
      status: 'soon',
    },
  ],
});
