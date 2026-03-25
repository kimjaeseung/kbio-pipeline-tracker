const KEY = 'kbio-watchlist-v1';

export function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function toggleWatch(id) {
  const list = getWatchlist();
  const idx = list.indexOf(id);
  if (idx === -1) list.push(id);
  else list.splice(idx, 1);
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

export function isWatched(id) {
  return getWatchlist().includes(id);
}
