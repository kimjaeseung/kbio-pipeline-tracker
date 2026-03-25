import { useState } from 'react';
import { TAG_COLORS, CONFIDENCE_COLORS } from '../utils/constants';

export default function GameChangerBadge({ type, label, confidence, reason, evidence, size = 'md', defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const colors = TAG_COLORS[type] || TAG_COLORS['watch'];
  const confColor = CONFIDENCE_COLORS[confidence] || '#94a3b8';

  if (size === 'sm') {
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, color: colors.text,
        background: colors.bg, border: `1px solid ${colors.border}`,
        padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap',
        display: 'inline-flex', alignItems: 'center', gap: 3,
      }}>
        {label}
      </span>
    );
  }

  if (size === 'md') {
    return (
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          border: `1px solid ${colors.border}`,
          background: colors.bg,
          borderRadius: 8,
          padding: '8px 12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{label}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: confColor, fontWeight: 600 }}>{confidence.toUpperCase()}</span>
            <span style={{ color: '#64748b', fontSize: 11 }}>{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
        {expanded && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{reason}</div>
        )}
      </div>
    );
  }

  // size === 'lg'
  return (
    <div style={{
      border: `2px solid ${colors.border}`,
      background: colors.bg,
      borderRadius: 12,
      padding: 20,
      boxShadow: `0 0 20px ${colors.border}33`,
      animation: type === 'game-changer' ? 'none' : 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: 16, fontWeight: 800, color: colors.text }}>{label}</span>
        <span style={{ fontSize: 11, color: confColor, fontWeight: 700, background: `${confColor}22`, padding: '2px 8px', borderRadius: 4 }}>
          confidence: {confidence.toUpperCase()}
        </span>
      </div>
      <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, margin: '0 0 14px' }}>{reason}</p>
      {evidence && evidence.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>근거:</div>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {evidence.map((e, i) => (
              <li key={i} style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 2 }}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
