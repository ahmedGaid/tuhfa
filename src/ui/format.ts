/** Arabic-Indic digits for learner text (tuhfa-brand). */
const nf = new Intl.NumberFormat('ar-EG', { useGrouping: false });

export const num = (n: number): string => nf.format(n);
export const pct = (ratio: number): string => `${num(Math.round(ratio * 100))}٪`;
