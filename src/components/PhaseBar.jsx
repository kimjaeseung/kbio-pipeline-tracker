import { PHASE_ORDER, PHASE_COLOR } from '../utils/constants';

export default function PhaseBar({ phase, showLabel = true }) {
  const w = ((PHASE_ORDER[phase] || 1) / 8) * 100;
  const color = PHASE_COLOR(phase);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: 11, color, fontWeight: 600, whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>{phase}</span>
      )}
    </div>
  );
}
