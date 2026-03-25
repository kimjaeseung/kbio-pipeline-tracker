import clinicalData from '../data/clinical-evidence.json';

function buildEvents() {
  const events = [];
  Object.entries(clinicalData).forEach(([drugKey, data]) => {
    data.previousResults?.forEach(r => {
      if (r.date) {
        events.push({
          date: r.date,
          drug: data.drugName,
          company: data.company,
          event: `${r.conference} ${r.phase} 데이터 발표`,
          importance: 'high',
          type: 'data',
          endpoints: r.endpoints,
        });
      }
    });
  });
  return events.sort((a, b) => b.date.localeCompare(a.date));
}

const TYPE_COLORS = {
  data: '#3b82f6',
  regulatory: '#10b981',
  deal: '#f59e0b',
  conference: '#8b5cf6',
};

const IMPORTANCE_DOT = {
  high: { size: 10, opacity: 1 },
  medium: { size: 8, opacity: 0.8 },
  low: { size: 6, opacity: 0.6 },
};

export default function CatalystCalendar({ maxItems = 8 }) {
  const events = buildEvents().slice(0, maxItems);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map((ev, i) => {
          const dot = IMPORTANCE_DOT[ev.importance] || IMPORTANCE_DOT.medium;
          const color = TYPE_COLORS[ev.type] || '#64748b';
          return (
            <div key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
            }}>
              <div style={{ flexShrink: 0, paddingTop: 4 }}>
                <div style={{
                  width: dot.size, height: dot.size, borderRadius: '50%',
                  background: color, opacity: dot.opacity,
                }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{ev.date}</span>
                  <span style={{ fontSize: 11, color: '#f1f5f9', fontWeight: 700 }}>{ev.drug}</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>· {ev.company}</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{ev.event}</div>
                {ev.endpoints && Object.keys(ev.endpoints).length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {Object.entries(ev.endpoints).slice(0, 3).map(([k, v]) => (
                      <span key={k} style={{
                        fontSize: 10, color: '#3b82f6',
                        background: 'rgba(59,130,246,0.1)',
                        padding: '1px 6px', borderRadius: 3,
                      }}>
                        {v.description || k}: {v.value}{v.unit}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
