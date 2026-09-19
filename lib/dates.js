// Local YYYY-MM-DD for a Date, avoiding UTC shift issues from toISOString().
export const toISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const isoDateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

export const parseLocalDate = (isoStr) => {
  const [y, m, d] = isoStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatShortDate = (isoStr) =>
  parseLocalDate(isoStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export const getThisWeekRange = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay(); // 0 = Sun ... 6 = Sat
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

export const isThisWeek = (isoStr) => {
  if (!isoStr) return false;
  const { start, end } = getThisWeekRange();
  const d = parseLocalDate(isoStr);
  return d >= start && d <= end;
};
