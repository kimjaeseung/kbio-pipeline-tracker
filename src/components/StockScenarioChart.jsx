import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

function parseExpectedReturn(str) {
  if (!str || str.startsWith('N/A')) return null;
  const match = str.match(/\+?(\d+)~(\d+)%/);
  if (!match) return null;
  const yearMatch = str.match(/(\d+)년/);
  return {
    base: parseInt(match[1]),
    bull: parseInt(match[2]),
    years: yearMatch ? parseInt(yearMatch[1]) : 2,
  };
}

function parseMaxLoss(str) {
  if (!str || str.startsWith('N/A')) return null;
  const match = str.match(/-(\d+)%/);
  return match ? parseInt(match[1]) : null;
}

function parseKoreanDate(str) {
  const yearMatch = str.match(/(\d{4})년/);
  const monthMatch = str.match(/(\d{1,2})월/);
  const dayMatch = str.match(/(\d{1,2})일/);
  if (!yearMatch || !monthMatch) return null;
  try {
    return new Date(
      parseInt(yearMatch[1]),
      parseInt(monthMatch[1]) - 1,
      dayMatch ? parseInt(dayMatch[1]) : 15,
    );
  } catch {
    return null;
  }
}

function formatKRW(price) {
  if (price >= 1000000) return `₩${(price / 10000).toFixed(0)}만`;
  if (price >= 100000) return `₩${(price / 1000).toFixed(0)}k`;
  return `₩${Math.round(price).toLocaleString()}`;
}

function formatYAxis(price) {
  if (price >= 1000000) return `${(price / 10000).toFixed(0)}만`;
  if (price >= 100000) return `${(price / 1000).toFixed(0)}k`;
  return Math.round(price / 1000) + 'k';
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear().toString().slice(2)}`;
}

// Generate scenario data points starting from basePrice at startDate
function generateScenario(basePrice, returnPct1yr, milestones, startDate, endDate) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = (endDate - startDate) / msPerDay;
  const futureMilestones = milestones.filter(m => m.date >= startDate && m.date <= endDate);

  // Evenly distribute returns: base growth + milestone bumps
  const baseMonthly = returnPct1yr / 100 / 12;
  const msBumpTotal = returnPct1yr * 0.35; // 35% of total return comes from milestone jumps
  const msBumpPerEvent = futureMilestones.length > 0 ? msBumpTotal / futureMilestones.length : 0;

  const points = [];
  let current = new Date(startDate);
  let milestoneIdx = 0;
  let bumpAccumulated = 0;

  while (current <= endDate) {
    const daysElapsed = (current - startDate) / msPerDay;
    const progressRatio = daysElapsed / totalDays;

    // Base linear growth contribution
    const baseGrowth = returnPct1yr * 0.65 * progressRatio;

    // Count passed milestones
    while (
      milestoneIdx < futureMilestones.length &&
      futureMilestones[milestoneIdx].date <= current
    ) {
      bumpAccumulated += msBumpPerEvent;
      milestoneIdx++;
    }

    const totalReturn = baseGrowth + bumpAccumulated;
    points.push({
      date: current.getTime(),
      price: basePrice * (1 + totalReturn / 100),
    });

    current = new Date(current.getTime() + 7 * msPerDay); // weekly steps
  }
  return points;
}

export default function StockScenarioChart({ company, insights }) {
  const [historical, setHistorical] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const returnData = parseExpectedReturn(insights?.view?.expected_return);
  const maxLoss = parseMaxLoss(insights?.view?.max_loss);

  useEffect(() => {
    if (!company.id || !returnData) {
      setLoading(false);
      return;
    }

    // 빌드 타임에 pre-fetch된 정적 JSON 읽기 (public/stock-data.json)
    fetch('/stock-data.json')
      .then(r => {
        if (!r.ok) throw new Error('stock-data.json 없음');
        return r.json();
      })
      .then(json => {
        const raw = json?.data?.[company.id];
        if (!raw || raw.length === 0) throw new Error('데이터 없음');
        // { date: timestamp_ms, price: number } 형태로 정규화
        const prices = raw
          .map(d => ({ date: new Date(d.date), price: d.price }))
          .filter(d => d.price > 0);
        setHistorical(prices);
        setLoading(false);
      })
      .catch(() => {
        setApiError(true);
        setLoading(false);
      });
  }, [company.id]); // eslint-disable-line

  const { chartData, futureMilestones } = useMemo(() => {
    if (!returnData) return { chartData: [], futureMilestones: [] };

    const today = new Date();
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

    // Parse milestones from checkpoints
    const checkpoints = insights?.checkpoints || [];
    const allMilestones = checkpoints
      .map(cp => {
        const d = parseKoreanDate(cp);
        const label = cp.split(':')[0].trim();
        return d ? { date: d, label } : null;
      })
      .filter(Boolean);

    const futureMilestones = allMilestones.filter(
      m => m.date > today && m.date <= oneYearLater,
    );

    const currentPrice = historical.length > 0
      ? historical[historical.length - 1].price
      : null;

    if (!currentPrice) {
      return { chartData: [], futureMilestones };
    }

    // Historical points
    const histPoints = historical.map(d => ({
      date: d.date.getTime(),
      actual: d.price,
      bull: null,
      base: null,
    }));

    // Scenario returns for 1 year (half of stated period)
    const periodYears = returnData.years || 2;
    const bull1yr = returnData.bull / periodYears;
    const base1yr = returnData.base / periodYears;

    const bullPoints = generateScenario(currentPrice, bull1yr, futureMilestones, today, oneYearLater);
    const basePoints = generateScenario(currentPrice, base1yr, futureMilestones, today, oneYearLater);

    // Merge: junction at today, then forecast
    const forecastMap = new Map();
    bullPoints.forEach(p => forecastMap.set(p.date, { bull: p.price }));
    basePoints.forEach(p => {
      const existing = forecastMap.get(p.date) || {};
      forecastMap.set(p.date, { ...existing, base: p.price });
    });

    const forecastPoints = [...forecastMap.entries()].map(([date, vals]) => ({
      date,
      actual: null,
      bull: vals.bull,
      base: vals.base,
    }));

    // Junction point
    const junction = {
      date: today.getTime(),
      actual: currentPrice,
      bull: currentPrice,
      base: currentPrice,
    };

    const combined = [...histPoints, junction, ...forecastPoints].sort(
      (a, b) => a.date - b.date,
    );

    return { chartData: combined, futureMilestones };
  }, [historical, insights, returnData]);

  if (!returnData) return null;

  const currentPrice = historical.length > 0 ? historical[historical.length - 1].price : null;
  const priceChange1yr =
    currentPrice && historical.length > 1
      ? ((currentPrice - historical[0].price) / historical[0].price) * 100
      : null;

  const bull1yr = Math.round(returnData.bull / (returnData.years || 2));
  const base1yr = Math.round(returnData.base / (returnData.years || 2));
  const bullPct = insights?.view?.bull_pct;

  const today = new Date().getTime();

  return (
    <section style={{ marginTop: 40 }}>
      <h2
        style={{
          fontSize: 16, fontWeight: 700, color: '#f1f5f9',
          marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        주가 시나리오 분석
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
          실제 주가(1년) + 인사이트 기반 시나리오 추정
        </span>
      </h2>

      {/* Metric cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {currentPrice && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>현재 주가</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
              {formatKRW(currentPrice)}
            </div>
          </div>
        )}

        {priceChange1yr !== null && (
          <div
            style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 16px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>1년 수익률</div>
            <div
              style={{
                fontSize: 20, fontWeight: 700,
                color: priceChange1yr >= 0 ? '#10b981' : '#ef4444',
              }}
            >
              {priceChange1yr >= 0 ? '+' : ''}
              {priceChange1yr.toFixed(1)}%
            </div>
          </div>
        )}

        <div
          style={{
            background: 'rgba(16,185,129,0.06)', borderRadius: 8, padding: '10px 16px',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>
            강세 시나리오 (1년){bullPct ? ` · 확률 ${bullPct}%` : ''}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>
            +{bull1yr}%
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
            {insights?.view?.bull_case?.slice(0, 40)}…
          </div>
        </div>

        <div
          style={{
            background: 'rgba(245,158,11,0.06)', borderRadius: 8, padding: '10px 16px',
            border: '1px solid rgba(245,158,11,0.2)',
          }}
        >
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>기본 시나리오 (1년)</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>
            +{base1yr}%
          </div>
        </div>

        {maxLoss && (
          <div
            style={{
              background: 'rgba(239,68,68,0.06)', borderRadius: 8, padding: '10px 16px',
              border: '1px solid rgba(239,68,68,0.15)',
            }}
          >
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>최대 손실 (약세)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>
              -{maxLoss}%
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <div
          style={{
            height: 300, background: 'rgba(255,255,255,0.02)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#64748b', fontSize: 13,
          }}
        >
          주가 데이터 불러오는 중...
        </div>
      ) : apiError || chartData.length === 0 ? (
        <div
          style={{
            height: 120, background: 'rgba(255,255,255,0.02)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#475569', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)',
            flexDirection: 'column', gap: 6,
          }}
        >
          <span style={{ fontSize: 20 }}>📡</span>
          실시간 주가 데이터를 불러오지 못했습니다
          <span style={{ fontSize: 11, color: '#334155' }}>npm run fetch-stocks 실행 후 재배포하면 주가 차트가 표시됩니다</span>
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 8px 8px' }}>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={formatDate}
                tick={{ fill: '#475569', fontSize: 10 }}
                tickCount={12}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: '#475569', fontSize: 10 }}
                width={46}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (value == null) return [null, null];
                  const labels = {
                    actual: '실제 주가',
                    bull: '강세 시나리오',
                    base: '기본 시나리오',
                  };
                  return [formatKRW(value), labels[name] || name];
                }}
                labelFormatter={v => new Date(v).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                contentStyle={{
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, fontSize: 12,
                }}
                labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={value => {
                  const labels = {
                    actual: '실제 주가 (Yahoo Finance)',
                    bull: `강세 시나리오 (+${bull1yr}%/1yr)`,
                    base: `기본 시나리오 (+${base1yr}%/1yr)`,
                  };
                  return <span style={{ color: '#94a3b8' }}>{labels[value] || value}</span>;
                }}
              />

              {/* Today divider */}
              <ReferenceLine
                x={today}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="4 3"
                label={{
                  value: '오늘',
                  position: 'insideTopLeft',
                  fill: '#64748b',
                  fontSize: 10,
                  dy: -2,
                }}
              />

              {/* Milestone markers */}
              {futureMilestones.map((m, i) => (
                <ReferenceLine
                  key={i}
                  x={m.date.getTime()}
                  stroke="rgba(99,102,241,0.35)"
                  strokeDasharray="2 4"
                  label={{
                    value: m.label.length > 14 ? m.label.slice(0, 13) + '…' : m.label,
                    position: 'insideTopRight',
                    fill: '#818cf8',
                    fontSize: 9,
                    angle: -45,
                    dy: -2,
                  }}
                />
              ))}

              {/* Lines */}
              <Line
                dataKey="actual"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                name="actual"
                connectNulls={false}
                activeDot={{ r: 4, fill: '#60a5fa' }}
              />
              <Line
                dataKey="bull"
                stroke="#10b981"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                name="bull"
                connectNulls={false}
              />
              <Line
                dataKey="base"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
                name="base"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Disclaimer */}
      <div
        style={{
          marginTop: 10, padding: '8px 12px',
          background: 'rgba(255,255,255,0.02)', borderRadius: 6,
          fontSize: 10, color: '#475569', lineHeight: 1.6,
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        ⚠️ 시나리오 선은 본 사이트의 인사이트 분석을 기반으로 추정한 참고 자료이며, 투자 조언이 아닙니다.
        실제 주가는 분석과 무관하게 다양한 외부 요인에 의해 변동될 수 있습니다. 투자 판단의 책임은 투자자 본인에게 있습니다.
      </div>
    </section>
  );
}
