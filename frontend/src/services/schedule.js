export function scheduleLabel(schedule) {
  if (!schedule) return "Расписание не задано";
  return schedule.schedule_type === "SPECIFIC_TIME"
    ? schedule.specific_times.join(" · ")
    : `Каждые ${schedule.interval_minutes / 60} ч · с ${schedule.anchor_at.slice(11, 16)}`;
}
export function nextOccurrence(item, schedule, now = new Date()) {
  if (!schedule || ["paused", "completed"].includes(item.status)) return null;
  const start = new Date(`${item.start_date}T00:00:00+03:00`);
  const end = item.end_date
    ? new Date(`${item.end_date}T23:59:59+03:00`)
    : new Date("2100-01-01");
  const from = new Date(Math.max(now.getTime(), start.getTime()));
  if (from > end) return null;
  if (schedule.schedule_type === "INTERVAL") {
    const anchor = new Date(schedule.anchor_at);
    const step = schedule.interval_minutes * 60000;
    const next = new Date(
      anchor.getTime() + Math.max(0, Math.ceil((from - anchor) / step)) * step,
    );
    return next <= end ? next : null;
  }
  const day = new Date(from.getTime() + 3 * 3600000).toISOString().slice(0, 10);
  const candidates = [0, 1].flatMap((offset) => {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + offset);
    return schedule.specific_times.map(
      (time) => new Date(`${date.toISOString().slice(0, 10)}T${time}:00+03:00`),
    );
  });
  return (
    candidates
      .filter((date) => date >= from && date <= end)
      .sort((a, b) => a - b)[0] || null
  );
}
export const localDateTime = () =>
  new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 16);
export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("ru-RU", {
        timeZone: "Europe/Moscow",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
