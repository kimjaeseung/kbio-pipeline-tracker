import { useNavigate } from 'react-router-dom';
import catalysts from '../data/catalysts.json';
import { getDDay, formatDDay, formatDisplayDate } from '../utils/dateUtils';

const TYPE_COLORS = { data: '#3b82f6', regulatory: '#10b981', deal: '#8b5cf6', conference: '#f97316' };
const TYPE_LABELS = { data: '데이터', regulatory: '허가', deal: '딜', conference: '학회' };

export default function CompanyEventTimeline({ companyId }) {
  const navigate = useNavigate();
  const events = catalysts.events
    .filter(e => e.companyId === companyId)
    .sort((a, b) => {
      const da = a.date || '9999';
      const db = b.date || '9999';
      return da.localeCompare(db);
    });

  if (events.length === 0) return null;

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {/* Vertical line */}
        <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)' }} />

        {events.map((ev, i) => {
          const dday = getDDay(ev.date);
          const isPast = ev.status === 'completed' || (dday !== null && dday < 0);
          const typeColor = TYPE_COLORS[ev.type] || '#64748b';

          return (
            <div key={ev.id} style={{ display: 'flex', gap: 16, marginBottom: 20, position: 'relative' }}>
              {/* Dot */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: isPast ? 'rgba(255,255,255,0.06)' : `${typeColor}22`,
                border: `2px solid ${isPast ? 'rgba(255,255,255,0.15)' : typeColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, zIndex: 1, marginTop: 2,
              }}>
                {isPast ? '✓' : '◎'}
              </div>

              {/* Content */}
              <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${isPast ? 'rgba(255,255,255,0.06)' : `${typeColor}33`}`,
                borderRadius: 8,
                padding: '10px 14px',
                opacity: isPast ? 0.7 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: typeColor, background: `${typeColor}18`, padding: '1px 6px', borderRadius: 3 }}>
                      {TYPE_LABELS[ev.type] || ev.type}
                    </span>
                    {ev.status === 'tentative' && <span style={{ fontSize: 10, color: '#64748b' }}>미확정</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{formatDisplayDate(ev)}</span>
                    {!isPast && dday !== null && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: dday <= 30 ? '#f59e0b' : '#64748b' }}>
                        {formatDDay(dday)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: isPast ? '#94a3b8' : '#f1f5f9', fontWeight: 500, marginBottom: ev.impact ? 6 : 0, lineHeight: 1.4 }}>
                  {ev.event}
                </div>
                {ev.impact && (
                  <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{ev.impact}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
