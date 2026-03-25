import { PHASE_COLOR } from '../utils/constants';

// 임상 단계 → x축 위치 (0~100%)
const PHASE_POS = {
  '전임상': 8,
  'IND 승인': 15,
  'IND': 15,
  'Phase 1': 25,
  'Phase 1a': 25,
  'Phase 1b': 30,
  'Phase 1/2': 35,
  'Phase 1b/2': 35,
  'Phase 2': 45,
  'Phase 2a': 42,
  'Phase 2/3': 58,
  'Phase 3': 68,
  'BLA 제출 완료': 82,
  'NDA/BLA 심사': 85,
  'FDA 승인 완료': 95,
  '허가 완료 (국내)': 92,
  '허가 완료 (국내/유럽)': 92,
  '시판 중': 98,
  '시판 중 (국내)': 98,
  '시판 중 (국내/유럽)': 98,
  '시판 중 (글로벌)': 100,
};

function getPos(phase) {
  if (!phase) return 10;
  for (const [key, val] of Object.entries(PHASE_POS)) {
    if (phase.includes(key)) return val;
  }
  return 10;
}

const IMPORTANCE_COLOR = {
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#475569',
};

export default function PipelineRoadmap({ pipelines, catalysts = [], onDrugClick }) {
  const milestones = ['전임상', 'Phase 1', 'Phase 2', 'Phase 3', 'BLA/NDA', '승인/시판'];
  const milestonePositions = [8, 25, 45, 68, 82, 98];

  // 이벤트를 파이프라인과 매핑
  const eventMap = {};
  (catalysts || []).forEach(evt => {
    if (!eventMap[evt.drug]) eventMap[evt.drug] = [];
    eventMap[evt.drug].push(evt);
  });

  return (
    <div style={{ marginTop: 8 }}>
      {/* X축 레이블 */}
      <div style={{ position: 'relative', height: 24, marginBottom: 4, paddingLeft: 160 }}>
        {milestones.map((m, i) => (
          <div key={m} style={{
            position: 'absolute',
            left: `calc(${milestonePositions[i]}% + 160px - ${milestonePositions[i] > 50 ? 40 : 0}px)`,
            top: 0,
            transform: 'translateX(-50%)',
            fontSize: 9,
            color: '#475569',
            whiteSpace: 'nowrap',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            {m}
          </div>
        ))}
      </div>

      {/* 단계 구분선 */}
      <div style={{ position: 'relative', paddingLeft: 160, marginBottom: 6, height: 10 }}>
        {milestonePositions.map(pos => (
          <div key={pos} style={{
            position: 'absolute',
            left: `calc(${pos}% + 160px)`,
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,255,255,0.05)',
          }} />
        ))}
      </div>

      {/* 파이프라인 행들 */}
      {pipelines.map((p, i) => {
        const pos = getPos(p.phase);
        const color = PHASE_COLOR(p.phase);
        const events = eventMap[p.drug] || [];
        const isApproved = pos >= 90;
        const isActive = p.status === 'active';

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 10,
              padding: '6px 0',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            {/* 약물명 — 넉넉한 고정폭 + 줄바꿈 허용 */}
            <div
              style={{
                width: 155,
                flexShrink: 0,
                paddingRight: 10,
                cursor: onDrugClick ? 'pointer' : 'default',
              }}
              onClick={() => onDrugClick && onDrugClick(p)}
            >
              <div style={{
                fontSize: 11,
                color: '#e2e8f0',
                fontWeight: 600,
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}>
                {p.drug}
              </div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 1 }}>{p.indication?.split(',')[0]}</div>
            </div>

            {/* 트랙 */}
            <div style={{ flex: 1, position: 'relative', height: 22 }}>
              {/* 배경 트랙 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: 4,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
                transform: 'translateY(-50%)',
              }} />

              {/* 진행 바 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                width: `${pos}%`,
                height: 4,
                background: isApproved
                  ? `linear-gradient(90deg, ${color}33, ${color})`
                  : `linear-gradient(90deg, ${color}22, ${color}88)`,
                borderRadius: 2,
                transform: 'translateY(-50%)',
              }} />

              {/* 현재 단계 점 */}
              <div style={{
                position: 'absolute',
                left: `calc(${pos}% - 6px)`,
                top: '50%',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: color,
                border: `2px solid ${isActive ? '#0f172a' : '#1e293b'}`,
                transform: 'translateY(-50%)',
                boxShadow: isActive ? `0 0 8px ${color}88` : 'none',
                zIndex: 2,
              }} />

              {/* 임상 이벤트 마커 */}
              {events.map((evt, j) => {
                const impColor = IMPORTANCE_COLOR[evt.importance] || '#475569';
                return (
                  <div
                    key={j}
                    title={`${evt.displayDate}: ${evt.event}`}
                    style={{
                      position: 'absolute',
                      left: `calc(${pos + 4 + j * 6}% - 5px)`,
                      top: '50%',
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      background: impColor,
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 3,
                      cursor: 'pointer',
                    }}
                  />
                );
              })}

              {/* 단계 레이블 */}
              <div style={{
                position: 'absolute',
                left: `calc(${pos}% + 8px)`,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 9,
                color,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                background: '#0f172a',
                padding: '1px 4px',
                borderRadius: 3,
                zIndex: 2,
              }}>
                {p.phase.length > 20 ? p.phase.substring(0, 18) + '…' : p.phase}
              </div>
            </div>
          </div>
        );
      })}

      {/* 범례 */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingLeft: 160, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 6px #3b82f688' }} />
          현재 단계 (활성)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#f59e0b', transform: 'rotate(45deg)' }} />
          다가오는 촉매 이벤트
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b' }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3b82f6', transform: 'rotate(45deg)' }} />
          중요도 중간 이벤트
        </div>
      </div>
    </div>
  );
}
