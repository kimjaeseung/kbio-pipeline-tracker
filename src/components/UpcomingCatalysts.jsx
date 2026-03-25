import { useNavigate } from 'react-router-dom';
import catalysts from '../data/catalysts.json';
import { getDDay, formatDDay, getDDayColor, formatDisplayDate } from '../utils/dateUtils';

const TYPE_COLORS = { data: '#3b82f6', regulatory: '#10b981', deal: '#8b5cf6', conference: '#f97316' };
const TYPE_LABELS = { data: '데이터', regulatory: '허가', deal: '딜', conference: '학회' };

const IMPORTANCE_BORDER = { high: '#f59e0b', medium: '#3b82f6', low: 'rgba(255,255,255,0.1)' };

export default function UpcomingCatalysts({ maxItems = 4 }) {
  const navigate = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = catalysts.events
    .filter(e => e.status === 'upcoming' || e.status === 'tentative')
    .map(e => ({ ...e, dday: getDDay(e.date) }))
    .filter(e => e.dday !== null && e.dday >= 0)
    .sort((a, b) => a.dday - b.dday)
    .slice(0, maxItems);

  if (upcoming.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
          다가오는 촉매
        </h2>
        <span
          onClick={() => navigate('/calendar')}
          style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', textDecoration: 'none' }}
        >
          전체 캘린더 →
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {upcoming.map(ev => {
          const ddayColor = getDDayColor(ev.dday, ev.importance);
          const borderColor = IMPORTANCE_BORDER[ev.importance];
          const typeColor = TYPE_COLORS[ev.type] || '#64748b';
          return (
            <div
              key={ev.id}
              onClick={() => navigate(`/company/${ev.companyId}`)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${borderColor}`,
                borderRadius: 10,
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* D-Day badge */}
              <div style={{ position: 'absolute', top: 12, right: 12 }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, color: ddayColor,
                  background: `${ddayColor}18`, border: `1px solid ${ddayColor}44`,
                  padding: '2px 8px', borderRadius: 6,
                }}>
                  {formatDDay(ev.dday)}
                </span>
              </div>

              {/* Type badge */}
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: typeColor, background: `${typeColor}18`, padding: '2px 7px', borderRadius: 3 }}>
                  {TYPE_LABELS[ev.type] || ev.type}
                </span>
                {ev.status === 'tentative' && (
                  <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>예정(미확정)</span>
                )}
              </div>

              {/* Company + Drug */}
              <div style={{ marginBottom: 4, paddingRight: 60 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>{ev.company}</span>
                {ev.drug && <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>· {ev.drug}</span>}
              </div>

              {/* Event */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 6, lineHeight: 1.4 }}>
                {ev.event}
              </div>

              {/* Date */}
              <div style={{ fontSize: 11, color: '#64748b' }}>{formatDisplayDate(ev)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
