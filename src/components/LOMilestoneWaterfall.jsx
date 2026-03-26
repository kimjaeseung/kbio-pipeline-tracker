import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

// 단위 포맷: 억원 → "2,600억" / 1조 이상 → "1.5조"
function formatAmt(amt) {
  if (amt >= 10000) return `${(amt / 10000).toFixed(1)}조`;
  if (amt >= 1000) return `${(amt / 1000).toFixed(1)}천억`;
  return `${amt.toLocaleString()}억`;
}

// 로그 스케일 처리: 0은 1로 처리
function logVal(v) {
  return v > 0 ? Math.log10(v + 1) : 0;
}

// 커스텀 툴팁
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 12,
      maxWidth: 260,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontWeight: 700, color: '#f1f5f9', marginBottom: 6, fontSize: 13 }}>
        {d.partner}
      </div>
      <div style={{ color: '#94a3b8', marginBottom: 4 }}>약물: {d.drug}</div>
      <div style={{ color: '#94a3b8', marginBottom: 8 }}>계약: {d.year}년</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {d.upfront > 0 && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '4px 10px' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>선급금</span>
            <span style={{ color: '#f1f5f9', marginLeft: 6, fontWeight: 700 }}>{formatAmt(d.upfront)}</span>
            <span style={{ color: '#64748b', fontSize: 10, marginLeft: 4 }}>확정 수령</span>
          </div>
        )}
        {d.milestone > 0 && (
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px dashed rgba(59,130,246,0.4)', borderRadius: 6, padding: '4px 10px' }}>
            <span style={{ color: '#3b82f6', fontWeight: 700 }}>마일스톤</span>
            <span style={{ color: '#f1f5f9', marginLeft: 6, fontWeight: 700 }}>최대 {formatAmt(d.milestone)}</span>
            <span style={{ color: '#64748b', fontSize: 10, marginLeft: 4 }}>조건부</span>
          </div>
        )}
      </div>
      {d.royaltyNote && (
        <div style={{ marginTop: 8, color: '#8b5cf6', fontSize: 11, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
          + {d.royaltyNote}
        </div>
      )}
    </div>
  );
}

// 커스텀 X축 틱 (파트너명 줄임)
function CustomXTick({ x, y, payload }) {
  const label = payload.value.length > 6 ? payload.value.slice(0, 6) + '…' : payload.value;
  return (
    <text x={x} y={y + 12} textAnchor="middle" fill="#64748b" fontSize={11}>
      {label}
    </text>
  );
}

export default function LOMilestoneWaterfall({ company }) {
  const [useLog, setUseLog] = useState(false);
  const deals = company.dealHistory;
  if (!deals || deals.length === 0) return null;

  // 각 딜의 표시 데이터 준비
  const chartData = deals.map(d => ({
    ...d,
    upfrontDisplay: useLog ? logVal(d.upfront) : d.upfront,
    milestoneDisplay: useLog ? logVal(d.milestone) : d.milestone,
    total: d.upfront + d.milestone,
  }));

  const totalUpfront = deals.reduce((s, d) => s + d.upfront, 0);
  const totalMilestone = deals.reduce((s, d) => s + d.milestone, 0);
  const grandTotal = totalUpfront + totalMilestone;

  // 최대값 기준 Y축 동적 설정
  const maxVal = Math.max(...chartData.map(d => d.total));
  const needLog = maxVal > 5000;

  return (
    <section style={{ marginBottom: 36 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            기술이전(L/O) 누적 마일스톤
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
            확정 수령액(선급금) + 조건부 잠재가치(마일스톤)
          </p>
        </div>
        {needLog && (
          <button
            onClick={() => setUseLog(v => !v)}
            style={{
              fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
              background: useLog ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${useLog ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: useLog ? '#3b82f6' : '#64748b',
            }}
          >
            {useLog ? '로그 스케일 ✓' : '로그 스케일'}
          </button>
        )}
      </div>

      {/* 요약 카드 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '12px 18px', flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>선급금 합계 (확정)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>{formatAmt(totalUpfront)}</div>
        </div>
        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: 10, padding: '12px 18px', flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>마일스톤 합계 (잠재)</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6' }}>{formatAmt(totalMilestone)}</div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '2px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '12px 18px', flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4, fontWeight: 600 }}>Total Potential Value</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fbbf24', letterSpacing: -1 }}>{formatAmt(grandTotal)}</div>
        </div>
      </div>

      {/* 차트 */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 8px 12px' }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barCategoryGap="25%" margin={{ top: 8, right: 20, left: 10, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="partner" tick={<CustomXTick />} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => {
                if (useLog) return '';
                if (v >= 10000) return `${(v / 10000).toFixed(0)}조`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}천억`;
                return `${v}억`;
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 11 }}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />

            {/* 선급금 (확정) — 초록 실선 */}
            <Bar dataKey="upfrontDisplay" stackId="a" name="선급금" radius={[0, 0, 0, 0]} maxBarSize={52}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="#10b981" fillOpacity={0.85} />
              ))}
            </Bar>

            {/* 마일스톤 (잠재) — 파란 반투명 점선 효과 */}
            <Bar dataKey="milestoneDisplay" stackId="a" name="마일스톤" radius={[6, 6, 0, 0]} maxBarSize={52}>
              {chartData.map((d, i) => (
                <Cell key={i} fill="#3b82f6" fillOpacity={0.35} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" />
              ))}
              <LabelList
                dataKey="total"
                position="top"
                formatter={v => formatAmt(v)}
                style={{ fill: '#94a3b8', fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* 범례 */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 10, background: '#10b981', borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>선급금 (확정 수령)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 10, background: 'rgba(59,130,246,0.35)', border: '1.5px dashed #3b82f6', borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>마일스톤 (조건부)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 10, background: 'rgba(139,92,246,0.3)', border: '1px solid rgba(139,92,246,0.5)', borderRadius: 2 }} />
            <span style={{ fontSize: 11, color: '#64748b' }}>로열티 (허가 후 추정)</span>
          </div>
        </div>
      </div>

      {/* 딜 리스트 */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {deals.map((d, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8,
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 11, color: '#64748b', minWidth: 36 }}>{d.year}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', minWidth: 80 }}>{d.partner}</span>
            <span style={{ fontSize: 12, color: '#64748b', flex: 1 }}>{d.drug}</span>
            {d.upfront > 0 && (
              <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                선급금 {formatAmt(d.upfront)}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#3b82f6', background: 'rgba(59,130,246,0.08)', border: '1px dashed rgba(59,130,246,0.3)', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>
              최대 {formatAmt(d.milestone)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
