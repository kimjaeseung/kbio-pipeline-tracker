export function getDDay(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

export function formatDDay(diff) {
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function getDDayColor(diff, importance = 'medium') {
  if (diff === null) return '#64748b';
  if (diff < 0) return '#475569'; // past
  if (diff === 0) return '#ef4444'; // today
  if (diff <= 7) return '#ef4444'; // within a week
  if (diff <= 30) {
    if (importance === 'high') return '#f59e0b';
    if (importance === 'medium') return '#3b82f6';
    return '#64748b';
  }
  if (importance === 'high') return '#f59e0b';
  if (importance === 'medium') return '#3b82f6';
  return '#64748b';
}

export function formatDisplayDate(event) {
  if (event.displayDate) return event.displayDate;
  if (!event.date) return '-';
  const d = new Date(event.date);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

export function getMonthKey(dateStr) {
  if (!dateStr) return '9999-99';
  return dateStr.substring(0, 7);
}

export function groupByMonth(events) {
  const map = {};
  for (const ev of events) {
    const key = getMonthKey(ev.date);
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  }
  return map;
}
