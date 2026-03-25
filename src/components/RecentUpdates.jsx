import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import changelog from '../data/changelog.json';

const TYPE_LABELS = {
  clinical_result: { label: '임상 결과', color: '#3b82f6' },
  regulatory: { label: '규제/허가', color: '#10b981' },
  license_out: { label: '기술이전', color: '#f59e0b' },
  partnership: { label: '파트너십', color: '#8b5cf6' },
  ind_approval: { label: 'IND 승인', color: '#06b6d4' },
  ct_update: { label: 'CT.gov', color: '#64748b' },
  other: { label: '기타', color: '#475569' },
};

const IMPORTANCE_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#64748b',
};

export default function RecentUpdates({ maxItems = 5 }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const sorted = [...changelog].sort((a, b) => b.date.localeCompare(a.date));
  const visible = expanded ? sorted : sorted.slice(0, maxItems);

  if (sorted.length === 0) return null;

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
          최근 업데이트
        </h2>
        {sorted.length > maxItems && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 12, cursor: 'pointer', padding: 0 }}
          >
            {expanded ? '접기' : `더보기 +${sorted.length - maxItems}`}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {visible.map(item => {
          const typeInfo = TYPE_LABELS[item.type] || TYPE_LABELS.other;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${IMPORTANCE_COLORS[item.importance] || '#475569'}`,
                borderRadius: 6,
                cursor: item.companyId ? 'pointer' : 'default',
              }}
              onClick={() => item.companyId && navigate(`/company/${item.companyId}`)}
            >
              {/* Date */}
              <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace', whiteSpace: 'nowrap', paddingTop: 1 }}>
                {item.date}
              </span>

              {/* Company */}
              <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap', paddingTop: 1 }}>
                {item.company}
              </span>

              {/* Type badge */}
              <span style={{
                fontSize: 10, color: typeInfo.color, background: typeInfo.color + '18',
                padding: '1px 7px', borderRadius: 3, whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 2,
              }}>
                {typeInfo.label}
              </span>

              {/* Summary */}
              <span style={{ fontSize: 12, color: '#cbd5e1', flex: 1, lineHeight: 1.5 }}>
                {item.summary}
              </span>

              {/* Source link */}
              {item.url && item.url !== 'https://dart.fss.or.kr' && item.url !== 'https://clinicaltrials.gov' && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', paddingTop: 1 }}
                >
                  {item.source} ↗
                </a>
              )}
              {(!item.url || item.url === 'https://dart.fss.or.kr' || item.url === 'https://clinicaltrials.gov') && (
                <span style={{ fontSize: 10, color: '#334155', whiteSpace: 'nowrap' }}>{item.source}</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
