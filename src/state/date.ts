/** Local calendar dates as `YYYY-MM-DD` (research R12: the device's local date is the day boundary). */

export type Day = string;

export const dayOf = (d: Date): Day => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const today = (): Day => dayOf(new Date());

export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split('-').map(Number);
  return dayOf(new Date(y!, m! - 1, d! + n));
}
