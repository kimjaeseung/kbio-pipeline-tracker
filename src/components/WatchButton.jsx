import { useState, useEffect } from 'react';
import { isWatched, toggleWatch } from '../utils/watchlist';

export default function WatchButton({ id, size = 'md', onToggle }) {
  const [watched, setWatched] = useState(false);

  useEffect(() => {
    setWatched(isWatched(id));
  }, [id]);

  function handleClick(e) {
    e.stopPropagation();
    e.preventDefault();
    const newList = toggleWatch(id);
    setWatched(newList.includes(id));
    onToggle?.(newList);
  }

  const sizes = {
    sm: { fontSize: 14, padding: '3px 6px' },
    md: { fontSize: 18, padding: '6px 10px' },
    lg: { fontSize: 22, padding: '8px 12px' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <button
      onClick={handleClick}
      title={watched ? '관심 기업 해제' : '관심 기업 추가'}
      style={{
        background: watched ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${watched ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: 8,
        padding: s.padding,
        cursor: 'pointer',
        fontSize: s.fontSize,
        lineHeight: 1,
        transition: 'all 0.15s',
        color: watched ? '#f59e0b' : '#64748b',
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = watched ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = watched ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)'; }}
    >
      {watched ? '★' : '☆'}
    </button>
  );
}
