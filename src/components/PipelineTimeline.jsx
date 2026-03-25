import { PHASE_ORDER, PHASE_COLOR } from '../utils/constants';

export default function PipelineTimeline({ pipelines, onDrugClick }) {
  const phases = ['전임상', 'Phase 1', 'Phase 2', 'Phase 3', '승인'];
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, padding: '0 4px' }}>
        {phases.map(p => <span key={p} style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>{p}</span>)}
      </div>
      <div style={{ position: 'relative', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 10 }}>
        {[25, 50, 75].map(x => (
          <div key={x} style={{ position: 'absolute', left: `${x}%`, top: -2, width: 1, height: 8, background: 'rgba(255,255,255,0.1)' }} />
        ))}
      </div>
      {pipelines.map((p, i) => {
        const pos = ((PHASE_ORDER[p.phase] || 1) / 8) * 100;
        const color = PHASE_COLOR(p.phase);
        return (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: onDrugClick ? 'pointer' : 'default' }}
            onClick={() => onDrugClick && onDrugClick(p)}
          >
            <span style={{ fontSize: 11, color: '#94a3b8', width: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0 }}>
              {p.drug}
            </span>
            <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 7, position: 'relative', overflow: 'visible' }}>
              <div style={{
                width: `${pos}%`, height: '100%', borderRadius: 7,
                background: `linear-gradient(90deg, ${color}33, ${color})`,
                transition: 'width 0.6s ease',
              }} />
              <div style={{
                position: 'absolute', left: `calc(${pos}% - 5px)`, top: 2, width: 10, height: 10,
                borderRadius: '50%', background: color, border: '2px solid #0f172a',
              }} />
            </div>
            <span style={{ fontSize: 10, color: '#64748b', width: 80, textAlign: 'right', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {p.indication}
            </span>
          </div>
        );
      })}
    </div>
  );
}
