import { useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, ZAxis,
} from 'recharts';

// X축 반전: Grade3+ AE가 낮을수록 왼쪽(좋음) → X축을 반전시켜 표시
// 실제 값은 그대로 저장, 표시 시 반전

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  const isOurs = d.isOurs;
  return (
    <div style={{
      background: '#0f172a',
      border: `1px solid ${isOurs ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: 12,
      maxWidth: 240,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontWeight: 700, color: isOurs ? '#fbbf24' : '#f1f5f9', marginBottom: 4, fontSize: 13 }}>
        {d.name} {isOurs && '⭐'}
      </div>
      <div style={{ color: '#64748b', marginBottom: 8, fontSize: 11 }}>{d.company}</div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: '#64748b' }}>ORR (효능)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981' }}>{d.orr}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#64748b' }}>Grade 3+ AE (독성)</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: d.ae <= 10 ? '#10b981' : d.ae <= 20 ? '#f59e0b' : '#ef4444' }}>
            {d.ae != null ? `${d.ae}%` : 'N/A'}
          </div>
        </div>
        {d.n && (
          <div>
            <div style={{ fontSize: 10, color: '#64748b' }}>환자 수</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#94a3b8' }}>n={d.n}</div>
          </div>
        )}
      </div>
      {d.conference && (
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8, fontSize: 11, color: '#8b5cf6' }}>
          출처: {d.conference} {d.date ? `(${d.date})` : ''}
        </div>
      )}
      {d.regimen && (
        <div style={{ marginTop: 4, fontSize: 11, color: '#475569' }}>
          요법: {d.regimen}
        </div>
      )}
    </div>
  );
}

// 커스텀 도트 렌더링 (이름 라벨 포함)
function CustomDot(props) {
  const { cx, cy, payload, r } = props;
  if (!cx || !cy) return null;
  const isOurs = payload.isOurs;
  const isPending = payload.isPending;

  if (isPending) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={r || 8} fill="rgba(100,116,139,0.2)" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 2" />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="#64748b" fontSize={9}>?</text>
        <text x={cx} y={cy - (r || 8) - 6} textAnchor="middle" fill="#475569" fontSize={10}>{payload.name}</text>
      </g>
    );
  }

  return (
    <g>
      <circle
        cx={cx} cy={cy} r={r || 8}
        fill={isOurs ? '#f59e0b' : '#64748b'}
        fillOpacity={isOurs ? 0.9 : 0.5}
        stroke={isOurs ? '#fbbf24' : '#475569'}
        strokeWidth={isOurs ? 2 : 1}
      />
      <text
        x={cx}
        y={cy - (r || 8) - 6}
        textAnchor="middle"
        fill={isOurs ? '#fbbf24' : '#94a3b8'}
        fontSize={isOurs ? 11 : 10}
        fontWeight={isOurs ? 700 : 400}
      >
        {payload.name.length > 12 ? payload.name.slice(0, 12) + '…' : payload.name}
      </text>
    </g>
  );
}

export default function EfficiencySafetyBubble({ drugName, evidence }) {
  const [showLabels, setShowLabels] = useState(true);

  if (!evidence) return null;

  const { previousResults, competitorComparison } = evidence;
  const mainResult = previousResults?.[0];
  if (!mainResult) return null;

  const mainORR = mainResult.endpoints?.ORR?.value;
  const mainAE = mainResult.endpoints?.grade3PlusAE?.value;
  if (mainORR == null) return null;

  // 데이터 포인트 조합
  const points = [];

  // 우리 약물
  points.push({
    name: drugName,
    company: evidence.company || '',
    orr: mainORR,
    ae: mainAE ?? null,
    n: mainResult.patientCount,
    conference: mainResult.conference,
    date: mainResult.date,
    regimen: mainResult.regimen,
    isOurs: true,
    isPending: false,
    // X는 inverted: 낮은 AE가 왼쪽에 → xVal = 100 - ae (ae 없으면 50)
    xVal: mainAE != null ? 100 - mainAE : 50,
    yVal: mainORR,
    zVal: mainResult.patientCount || 20,
  });

  // 경쟁약
  (competitorComparison?.competitors || []).forEach(comp => {
    const orr = comp.endpoints?.ORR?.value;
    const ae = comp.endpoints?.grade3PlusAE?.value;
    const isPending = orr == null;
    points.push({
      name: comp.drug,
      company: comp.company,
      orr: orr ?? 0,
      ae: ae ?? null,
      n: comp.patientCount,
      conference: '',
      date: '',
      regimen: comp.regimen,
      isOurs: false,
      isPending,
      xVal: isPending ? 50 : (ae != null ? 100 - ae : 50),
      yVal: orr ?? 0,
      zVal: 15,
    });
  });

  // 미충족 기준선: ORR 평균
  const validORRs = points.filter(p => !p.isPending && p.yVal > 0).map(p => p.yVal);
  const avgORR = validORRs.length > 0 ? validORRs.reduce((a, b) => a + b, 0) / validORRs.length : 40;

  // Goldilocks Zone: 높은 ORR + 낮은 AE = 오른쪽 상단 (x > 70, y > avgORR)
  const maxORR = Math.max(...points.map(p => p.yVal), 80) + 5;

  return (
    <section style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            효능 vs. 안전성 — Goldilocks Zone
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
            왼쪽 상단 = 고효능·저독성 이상적 영역. 버블 크기 = 환자 수(n)
          </p>
        </div>
        <button
          onClick={() => setShowLabels(v => !v)}
          style={{
            fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#64748b',
          }}
        >
          {showLabels ? '라벨 숨기기' : '라벨 보기'}
        </button>
      </div>

      {/* 4분면 설명 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {[
          { label: '🏆 Goldilocks Zone', desc: '고효능·저독성', color: '#10b981' },
          { label: '⚡ 고효능·고독성', desc: '효능 좋지만 독성 관리 필요', color: '#f59e0b' },
          { label: '❌ 저효능·고독성', desc: '개발 포기 영역', color: '#ef4444' },
          { label: '😐 저효능·저독성', desc: '안전하지만 효과 미흡', color: '#64748b' },
        ].map(z => (
          <div key={z.label} style={{ fontSize: 11, color: z.color, background: z.color + '10', border: `1px solid ${z.color}33`, padding: '3px 10px', borderRadius: 6 }}>
            {z.label} <span style={{ color: '#475569' }}>{z.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '20px 8px 8px' }}>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              type="number"
              dataKey="xVal"
              domain={[0, 100]}
              tickFormatter={v => `AE ${100 - v}%`}
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{ value: '← 독성 낮음 (Grade 3+ AE 역방향)', position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="yVal"
              domain={[0, maxORR]}
              tickFormatter={v => `${v}%`}
              tick={{ fill: '#475569', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'ORR % (효능)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11, offset: 10 }}
            />
            <ZAxis type="number" dataKey="zVal" range={[80, 500]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />

            {/* 4분면 구분선 */}
            <ReferenceLine x={50} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 3" />
            <ReferenceLine y={avgORR} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 3" />

            {/* Goldilocks Zone 하이라이트 (우측 상단) */}
            {/* Note: Recharts doesn't support rect reference area easily, use ReferenceArea */}

            <Scatter
              data={points}
              shape={showLabels ? <CustomDot /> : undefined}
            >
              {points.map((p, i) => (
                <Cell
                  key={i}
                  fill={p.isOurs ? '#f59e0b' : p.isPending ? '#1e293b' : '#475569'}
                  fillOpacity={p.isOurs ? 0.9 : p.isPending ? 0.3 : 0.5}
                  stroke={p.isOurs ? '#fbbf24' : p.isPending ? '#475569' : '#64748b'}
                  strokeWidth={p.isOurs ? 2 : 1}
                  strokeDasharray={p.isPending ? '3 2' : '0'}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* Goldilocks Zone 설명 */}
        <div style={{ textAlign: 'right', padding: '0 20px 8px', fontSize: 11, color: '#10b981' }}>
          ↖ 이 방향이 최적 영역 (낮은 독성 + 높은 효능)
        </div>
      </div>

      {/* 데이터 출처 표 */}
      <div style={{ marginTop: 10 }}>
        {points.filter(p => !p.isPending && p.yVal > 0).map((p, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, alignItems: 'center', padding: '6px 12px',
            background: p.isOurs ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.01)',
            border: `1px solid ${p.isOurs ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)'}`,
            borderRadius: 6, marginBottom: 4, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 12, fontWeight: p.isOurs ? 700 : 400, color: p.isOurs ? '#fbbf24' : '#94a3b8', minWidth: 120 }}>
              {p.isOurs && '⭐ '}{p.name}
            </span>
            <span style={{ fontSize: 11, color: '#10b981' }}>ORR {p.orr}%</span>
            {p.ae != null && <span style={{ fontSize: 11, color: p.ae <= 10 ? '#10b981' : p.ae <= 20 ? '#f59e0b' : '#ef4444' }}>AE {p.ae}%</span>}
            {p.n && <span style={{ fontSize: 11, color: '#64748b' }}>n={p.n}</span>}
            {p.conference && <span style={{ fontSize: 11, color: '#8b5cf6' }}>{p.conference}</span>}
          </div>
        ))}
        {points.filter(p => p.isPending).length > 0 && (
          <div style={{ fontSize: 11, color: '#475569', padding: '6px 12px', marginTop: 4 }}>
            * 데이터 미공개 약물은 Data Pending으로 표기 (차트 중앙)
          </div>
        )}
      </div>
    </section>
  );
}
