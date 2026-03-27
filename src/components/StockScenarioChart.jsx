/**
 * StockScenarioChart.jsx
 *
 * 알고리즘: Jump-Diffusion + 박스권 Mean-Reversion
 *
 * ① 역사적 변동성(σ) — 1년 주봉 데이터로 연간 변동성 자동 계산
 * ② GBM (Geometric Brownian Motion) — 매일 노이즈, 주별로 기록
 * ③ Ornstein-Uhlenbeck 박스권 — 마일스톤 사이 박스 채널 내 평균회귀
 * ④ Pre-milestone Compression — 이벤트 3주 전 변동성 50% 축소 (불확실성 반영)
 * ⑤ Jump at Milestone — 마일스톤 도달 시 타입별 점프 (Phase3=50%, FDA=65%, L/O=35%...)
 * ⑥ Post-jump Consolidation — 급등 후 2주간 변동성 확대 (흥분→소화 국면)
 * ⑦ Seeded RNG — 기업 ID 기반 시드, 새로고침에도 동일 경로 유지
 * ⑧ SOTP 검증 — 딜가치/시총 비율, 임상단계 확률가중 점수
 */

import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';

// ─── 결정론적 RNG (mulberry32) ───────────────────────────────────────────────
function makePRNG(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller: uniform → normal
function randNormal(rng) {
  let u, v;
  do { u = rng(); } while (u === 0);
  v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// 문자열 → 정수 시드
function strToSeed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

// ─── 파서 ────────────────────────────────────────────────────────────────────
function parseExpectedReturn(str) {
  if (!str || str.startsWith('N/A')) return null;
  const m = str.match(/\+?(\d+)~(\d+)%/);
  if (!m) return null;
  const y = str.match(/(\d+)년/);
  return { base: parseInt(m[1]), bull: parseInt(m[2]), years: y ? parseInt(y[1]) : 2 };
}

function parseMaxLoss(str) {
  if (!str || str.startsWith('N/A')) return null;
  const m = str.match(/-?(\d+)%/);
  return m ? parseInt(m[1]) : null;
}

function parseKoreanDate(str) {
  const y = str.match(/(\d{4})년/);
  const mo = str.match(/(\d{1,2})월/);
  const d = str.match(/(\d{1,2})일/);
  if (!y || !mo) return null;
  return new Date(parseInt(y[1]), parseInt(mo[1]) - 1, d ? parseInt(d[1]) : 15);
}

// ─── 마일스톤 임팩트 ─────────────────────────────────────────────────────────
function getMilestoneImpact(cp) {
  if (/3상|phase\s*3|phase\s*iii/i.test(cp)) return { bull: 50, base: 22, bear: -15, color: '#10b981', icon: '🔬', type: 'Phase 3 결과' };
  if (/2상|phase\s*2|phase\s*ii/i.test(cp)) return { bull: 28, base: 12, bear: -8, color: '#60a5fa', icon: '🧪', type: 'Phase 2 결과' };
  if (/1상|phase\s*1|phase\s*i/i.test(cp)) return { bull: 12, base: 5, bear: -3, color: '#a78bfa', icon: '💉', type: 'Phase 1 결과' };
  if (/fda|nda|bla|ema|허가|승인/i.test(cp)) return { bull: 65, base: 30, bear: -20, color: '#f59e0b', icon: '✅', type: '규제기관 허가' };
  if (/기술이전|l\/o|lo|계약 체결|deal/i.test(cp)) return { bull: 35, base: 18, bear: -5, color: '#ec4899', icon: '🤝', type: '기술이전/딜' };
  if (/로열티|royalty|수령|처방|수입/i.test(cp)) return { bull: 22, base: 10, bear: -3, color: '#f97316', icon: '💰', type: '로열티 수령' };
  if (/kospi|코스피 이전/i.test(cp)) return { bull: 18, base: 8, bear: -2, color: '#8b5cf6', icon: '📈', type: '코스피 이전' };
  if (/결과|데이터|발표|asco|esmo|ash|summit|학회/i.test(cp)) return { bull: 22, base: 10, bear: -8, color: '#06b6d4', icon: '📊', type: '학회 데이터 발표' };
  if (/특허|pgr|무효/i.test(cp)) return { bull: 25, base: 12, bear: -18, color: '#84cc16', icon: '⚖️', type: '특허/법적 이벤트' };
  return { bull: 10, base: 5, bear: -3, color: '#64748b', icon: '📌', type: '기타 이벤트' };
}

// ─── 역사적 연간 변동성 계산 ─────────────────────────────────────────────────
function calcAnnualVol(prices) {
  if (!prices || prices.length < 4) return 0.55; // 바이오텍 기본값 55%
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1].price > 0 && prices[i].price > 0) {
      returns.push(Math.log(prices[i].price / prices[i - 1].price));
    }
  }
  if (returns.length < 3) return 0.55;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.min(Math.max(Math.sqrt(variance * 52), 0.25), 1.20); // 25~120% 클램프
}

// ─── Jump-Diffusion + Ornstein-Uhlenbeck 시뮬레이션 ─────────────────────────
/**
 * scenario: 'bull' | 'base'
 * targetReturn1yr: %  (e.g. 100 = +100%)
 * annualVol: 연간 변동성 (e.g. 0.55)
 * milestones: [{ date, bull, base, bear }]
 * seed: 정수
 */
function simulatePath(startPrice, targetReturn1yr, annualVol, milestones, seed, scenario) {
  const rng = makePRNG(seed);
  const today = new Date();
  const endDate = new Date(today);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const MS_DAY = 86400000;
  const totalDays = Math.round((endDate - today) / MS_DAY);

  // 일간 파라미터
  const drift = (targetReturn1yr / 100) / 365;
  const σDay = annualVol / Math.sqrt(365);

  // 박스권 채널 초기화 (±6%)
  let channelLow = startPrice * 0.94;
  let channelHigh = startPrice * 1.06;
  let price = startPrice;

  // 마일스톤 이후 cooldown 카운터
  let postJumpDays = 0;

  const weekly = [];
  let dayIdx = 0;

  const sortedMilestones = [...milestones].sort((a, b) => a.date - b.date);

  for (let day = 0; day < totalDays; day++) {
    const currentDate = new Date(today.getTime() + day * MS_DAY);

    // ① 마일스톤 체크: 오늘이 마일스톤 날짜인가
    const hitMilestones = sortedMilestones.filter(m => {
      const diff = Math.abs(m.date.getTime() - currentDate.getTime());
      return diff < MS_DAY * 1.5;
    });

    if (hitMilestones.length > 0) {
      for (const m of hitMilestones) {
        const jumpPct = scenario === 'bull' ? m.bull : m.base;
        price *= (1 + jumpPct / 100);
        // 급등 후 채널 리셋 (±8%로 넓게)
        channelLow = price * 0.92;
        channelHigh = price * 1.08;
        postJumpDays = 14; // 2주 소화 국면
      }
    }

    // ② 다음 마일스톤까지 거리 계산
    const nextM = sortedMilestones.find(m => m.date > currentDate);
    const daysToNext = nextM ? (nextM.date.getTime() - currentDate.getTime()) / MS_DAY : 999;

    // ③ 변동성 조절
    let volFactor = 1.0;
    if (daysToNext <= 21) {
      // Pre-milestone compression: 3주 전부터 변동성 50% 감소 (불확실성으로 눌림)
      volFactor = 0.5 + 0.5 * (daysToNext / 21);
    } else if (postJumpDays > 0) {
      // Post-jump: 소화 국면, 변동성 1.5배
      volFactor = 1.5;
      postJumpDays--;
    }

    const σ = σDay * volFactor;

    // ④ 채널 중심 대비 평균회귀력 (Ornstein-Uhlenbeck)
    const channelMid = (channelHigh + channelLow) / 2;
    const channelWidth = channelHigh - channelLow;
    const posInChannel = channelWidth > 0 ? (price - channelLow) / channelWidth : 0.5; // 0~1
    // 채널 상단에 가까울수록 아래로 당기는 힘
    const reversionForce = (0.5 - posInChannel) * 0.04 * (scenario === 'bull' ? 0.6 : 0.9);

    // ⑤ GBM 스텝
    const Z = randNormal(rng);
    const logReturn = (drift + reversionForce - 0.5 * σ * σ) + σ * Z;
    price *= Math.exp(logReturn);

    // 채널 서서히 이동 (상방 드리프트)
    const channelDrift = drift * (scenario === 'bull' ? 0.6 : 0.3);
    channelLow *= (1 + channelDrift);
    channelHigh *= (1 + channelDrift);

    // 가격 하한 방어 (시작가의 25%~40%)
    const floor = startPrice * (scenario === 'bull' ? 0.35 : 0.30);
    price = Math.max(price, floor);

    // ⑥ 주봉 샘플링
    if (day % 7 === 0) {
      weekly.push({ date: currentDate.getTime(), price: Math.round(price) });
    }
  }

  return weekly;
}

// ─── 검증 지표 ───────────────────────────────────────────────────────────────
function calcValidation(company, insights, marketCap) {
  const totalDealKRW = (company.dealHistory || []).reduce((sum, d) => {
    return sum + ((d.upfront || 0) + (d.milestone || 0)) * 1e8;
  }, 0);

  const PHASE_PROBS = {
    'Preclinical': 0.05, 'Phase 1': 0.12, 'Phase 1/2': 0.18,
    'Phase 2': 0.30, 'Phase 2/3': 0.45, 'Phase 3': 0.60,
    'NDA/BLA Filed': 0.80, 'Approved': 0.90,
  };
  const pipelineScore = (company.pipelines || []).reduce(
    (sum, p) => sum + (PHASE_PROBS[p.phase] || 0.10), 0
  );

  return {
    totalDealKRW,
    dealToMarket: marketCap > 0 ? totalDealKRW / marketCap : 0,
    pipelineScore,
    pipelineCount: (company.pipelines || []).length,
    bullPct: insights?.view?.bull_pct || 50,
  };
}

// ─── 포맷 ────────────────────────────────────────────────────────────────────
function fPrice(v) {
  // 354000 → "354,000원"
  return `${Math.round(v).toLocaleString('ko-KR')}원`;
}

function fPriceCompact(v) {
  if (v >= 1e8) return `${(v / 1e8).toFixed(1)}억원`;
  if (v >= 1e7) return `${(v / 1e4).toFixed(0)}만원`;
  if (v >= 1e4) return `${Math.round(v / 1e4)}만원`;
  return `${Math.round(v).toLocaleString('ko-KR')}원`;
}

function fBigKRW(v) {
  if (v >= 1e12) return `${(v / 1e12).toFixed(1)}조원`;
  if (v >= 1e8) return `${Math.round(v / 1e8)}억원`;
  return `${Math.round(v / 1e8)}억원`;
}

function fAxisKRW(v) {
  if (v >= 1e7) return `${Math.round(v / 1e4)}만`;
  if (v >= 1e5) return `${Math.round(v / 1e3)}천`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(1)}만`;
  return `${Math.round(v).toLocaleString()}`;
}

function fDate(ts) {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear().toString().slice(2)}`;
}

// ─── 커스텀 컴포넌트 ──────────────────────────────────────────────────────────
function MilestoneNumberLabel({ viewBox, num, color }) {
  if (!viewBox) return null;
  const { x } = viewBox;
  const cy = 14;
  return (
    <g>
      <circle cx={x} cy={cy} r={8} fill={color + '22'} stroke={color + '90'} strokeWidth={1} />
      <text x={x} y={cy + 4} textAnchor="middle" fontSize={8} fontWeight={700} fill={color}>{num}</text>
    </g>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const d = new Date(label);
  const dateStr = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });

  const lineNames = {
    actual: { label: '실제 주가', color: '#60a5fa' },
    bull: { label: '강세 시나리오', color: '#10b981' },
    base: { label: '기본 시나리오', color: '#f59e0b' },
    band: { label: null, color: null }, // 밴드는 숨김
  };

  const entries = payload.filter(p => p.dataKey !== 'band' && p.value != null);

  return (
    <div style={{
      background: '#0f172a', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12, minWidth: 180,
    }}>
      <div style={{ color: '#64748b', marginBottom: 8, fontSize: 11 }}>{dateStr}</div>
      {entries.map((p, i) => {
        const meta = lineNames[p.dataKey] || { label: p.dataKey, color: p.stroke || '#fff' };
        if (!meta.label) return null;
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
            <span style={{ color: meta.color, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 2, background: meta.color, display: 'inline-block', borderRadius: 2 }} />
              {meta.label}
            </span>
            <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{fPrice(p.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 ────────────────────────────────────────────────────────────────────
export default function StockScenarioChart({ company, insights }) {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const returnData = parseExpectedReturn(insights?.view?.expected_return);
  const maxLoss = parseMaxLoss(insights?.view?.max_loss);

  useEffect(() => {
    if (!company.id || !returnData) { setLoading(false); return; }
    fetch('/stock-data.json')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => {
        const d = json?.data?.[company.id];
        if (!d?.prices?.length) throw new Error();
        setStockData(d);
        setLoading(false);
      })
      .catch(() => { setApiError(true); setLoading(false); });
  }, [company.id]); // eslint-disable-line

  // ─── 계산 ───────────────────────────────────────────────────────────────
  const computed = useMemo(() => {
    if (!returnData || !stockData?.prices?.length) return null;

    const prices = stockData.prices;
    const marketCap = stockData.marketCap || 0;
    const currentPrice = prices[prices.length - 1].price;
    const firstPrice = prices[0].price;

    // 1. 역사적 연간 변동성
    const annualVol = calcAnnualVol(prices);

    // 2. 마일스톤 파싱
    const today = new Date();
    const oneYearLater = new Date(today); oneYearLater.setFullYear(today.getFullYear() + 1);

    const milestones = (insights?.checkpoints || [])
      .map((cp, idx) => {
        const date = parseKoreanDate(cp);
        if (!date || date <= today || date > oneYearLater) return null;
        const imp = getMilestoneImpact(cp);
        return { ...imp, date, label: cp.split(':')[0].trim(), full: cp, idx: idx + 1 };
      })
      .filter(Boolean)
      .sort((a, b) => a.date - b.date);

    // 3. 시나리오 수익률 (1년 기준)
    const yrs = returnData.years || 2;
    const bull1yr = returnData.bull / yrs;
    const base1yr = returnData.base / yrs;

    // 4. 시드 기반 시뮬레이션
    const seed = strToSeed(company.id || 'default');
    const bullPath = simulatePath(currentPrice, bull1yr, annualVol * 0.85, milestones, seed, 'bull');
    const basePath = simulatePath(currentPrice, base1yr, annualVol, milestones, seed + 1, 'base');

    // 5. 차트 데이터 병합
    const histPoints = prices.map(d => ({
      date: d.date, actual: d.price, bull: null, base: null, band: null,
    }));

    const forecastMap = new Map();
    bullPath.forEach(p => forecastMap.set(p.date, { bull: p.price }));
    basePath.forEach(p => {
      const e = forecastMap.get(p.date) || {};
      forecastMap.set(p.date, { ...e, base: p.price });
    });

    const forecastPoints = [...forecastMap.entries()].map(([date, v]) => ({
      date,
      actual: null,
      bull: v.bull ?? null,
      base: v.base ?? null,
      // 신뢰구간 밴드용: bull - base
      band: (v.bull != null && v.base != null) ? v.bull - v.base : null,
    }));

    const junction = {
      date: today.getTime(), actual: currentPrice, bull: currentPrice, base: currentPrice, band: 0,
    };

    const chartData = [...histPoints, junction, ...forecastPoints].sort((a, b) => a.date - b.date);

    // 6. 검증 지표
    const validation = calcValidation(company, insights, marketCap);

    // 7. 1년 수익률
    const change1yr = firstPrice > 0 ? (currentPrice - firstPrice) / firstPrice * 100 : null;

    return {
      chartData, milestones, currentPrice, marketCap,
      annualVol, bull1yr, base1yr, validation, change1yr,
      bullTarget: currentPrice * (1 + bull1yr / 100),
      baseTarget: currentPrice * (1 + base1yr / 100),
      bearTarget: maxLoss ? currentPrice * (1 - maxLoss / 100) : null,
    };
  }, [stockData, insights, returnData, company, maxLoss]); // eslint-disable-line

  if (!returnData) return null;

  const today = new Date().getTime();

  // ─── 렌더 ───────────────────────────────────────────────────────────────
  return (
    <section style={{ marginTop: 48 }}>

      {/* 헤더 */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10, marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
          주가 시나리오 분석
        </h2>
        <p style={{ fontSize: 11, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>
          금융위원회 실제 주가 · Jump-Diffusion + 박스권 모델 · 기업 고유 변동성 반영
          {computed && (
            <span style={{ color: '#334155' }}> · 연간 변동성 {(computed.annualVol * 100).toFixed(0)}%</span>
          )}
        </p>
      </div>

      {loading ? (
        <div style={emptyStyle}>주가 데이터 로딩 중...</div>
      ) : apiError || !computed ? (
        <div style={{ ...emptyStyle, flexDirection: 'column', gap: 6, color: '#334155' }}>
          <span style={{ fontSize: 24 }}>📡</span>
          주가 데이터 없음
          <span style={{ fontSize: 11 }}>npm run fetch-stocks 실행 후 재배포</span>
        </div>
      ) : (
        <>
          {/* ─ 현재가 / 수익률 / 시총 ─ */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <StatCard
              label="현재 주가"
              value={fPrice(computed.currentPrice)}
              subValue={computed.change1yr != null
                ? `1년 ${computed.change1yr >= 0 ? '+' : ''}${computed.change1yr.toFixed(1)}%`
                : null}
              subColor={computed.change1yr >= 0 ? '#10b981' : '#ef4444'}
            />
            {computed.marketCap > 0 && (
              <StatCard label="시가총액" value={fBigKRW(computed.marketCap)} />
            )}
          </div>

          {/* ─ 차트 ─ */}
          <div style={{ background: 'rgba(255,255,255,0.015)', borderRadius: 14, padding: '20px 8px 12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}>

            {/* 범례 직접 */}
            <div style={{ display: 'flex', gap: 16, paddingLeft: 50, marginBottom: 8, flexWrap: 'wrap' }}>
              <LegendItem color="#60a5fa" solid label="실제 주가 (금융위원회)" />
              <LegendItem color="#10b981" dashed label={`강세 시나리오 (+${Math.round(computed.bull1yr)}%/1yr)`} />
              <LegendItem color="#f59e0b" dashed label={`기본 시나리오 (+${Math.round(computed.base1yr)}%/1yr)`} />
              {computed.milestones.length > 0 && (
                <span style={{ fontSize: 10, color: '#475569', alignSelf: 'center' }}>
                  ① ② ... = 마일스톤
                </span>
              )}
            </div>

            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={computed.chartData} margin={{ top: 10, right: 24, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="bullFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.01} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis
                  dataKey="date" type="number" scale="time"
                  domain={['dataMin', 'dataMax']} tickFormatter={fDate}
                  tick={{ fill: '#334155', fontSize: 10 }} tickCount={13}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false}
                />
                <YAxis
                  tickFormatter={fAxisKRW}
                  tick={{ fill: '#334155', fontSize: 10 }} width={52}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 오늘 구분선 */}
                <ReferenceLine
                  x={today}
                  stroke="rgba(255,255,255,0.18)"
                  strokeDasharray="3 4"
                  label={{ value: '오늘', position: 'insideTopLeft', fill: '#475569', fontSize: 9, dy: -4 }}
                />

                {/* 마일스톤 수직선 */}
                {computed.milestones.map((m, i) => (
                  <ReferenceLine
                    key={i}
                    x={m.date.getTime()}
                    stroke={m.color + '50'}
                    strokeWidth={1.5}
                    strokeDasharray="2 5"
                    label={<MilestoneNumberLabel num={i + 1} color={m.color} />}
                  />
                ))}

                {/* 실제 주가 (Area) */}
                <Area
                  dataKey="actual"
                  stroke="#60a5fa" strokeWidth={2}
                  fill="url(#actualFill)"
                  dot={false} connectNulls={false}
                  name="actual"
                />

                {/* 강세 시나리오 (Line, dashed) */}
                <Line
                  dataKey="bull"
                  stroke="#10b981" strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={false} connectNulls={false}
                  name="bull"
                />

                {/* 기본 시나리오 */}
                <Line
                  dataKey="base"
                  stroke="#f59e0b" strokeWidth={1.5}
                  strokeDasharray="5 4"
                  dot={false} connectNulls={false}
                  name="base"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* ─ 시나리오 목표가 ─ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginBottom: 16 }}>
            <ScenarioCard
              label="강세 시나리오 목표가"
              pct={`+${Math.round(computed.bull1yr)}%`}
              price={computed.bullTarget}
              color="#10b981"
              desc={insights?.view?.bull_case?.slice(0, 60) + (insights?.view?.bull_case?.length > 60 ? '…' : '')}
              prob={computed.validation.bullPct}
            />
            <ScenarioCard
              label="기본 시나리오 목표가"
              pct={`+${Math.round(computed.base1yr)}%`}
              price={computed.baseTarget}
              color="#f59e0b"
              desc={insights?.view?.bear_case?.slice(0, 60) + (insights?.view?.bear_case?.length > 60 ? '…' : '')}
            />
            {computed.bearTarget && (
              <ScenarioCard
                label="약세 시나리오 (최대손실)"
                pct={`-${maxLoss}%`}
                price={computed.bearTarget}
                color="#ef4444"
                desc={insights?.view?.bear_case?.slice(0, 60) + (insights?.view?.bear_case?.length > 60 ? '…' : '')}
                prob={100 - computed.validation.bullPct}
              />
            )}
          </div>

          {/* ─ 예측 근거 (Why) ─ */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              예측 근거
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
              {computed.validation.totalDealKRW > 0 && (
                <WhyCard
                  label="기술이전 가치 / 시총"
                  value={`${fBigKRW(computed.validation.totalDealKRW)} / ${computed.marketCap > 0 ? fBigKRW(computed.marketCap) : 'N/A'}`}
                  highlight={computed.validation.dealToMarket >= 0.5}
                  badge={
                    computed.validation.dealToMarket >= 1.0 ? '시총 초과 → 저평가'
                    : computed.validation.dealToMarket >= 0.5 ? '딜가치 ≥ 시총 50%'
                    : '딜가치 < 시총 50%'
                  }
                  tip="계약 완료된 L/O 계약 총액 대비 현재 시총. 1 이상이면 플랫폼 가치가 시총에 미반영된 상태."
                />
              )}
              <WhyCard
                label="임상 확률가중 파이프라인 점수"
                value={`${computed.validation.pipelineScore.toFixed(2)}점 (${computed.validation.pipelineCount}개)`}
                highlight={computed.validation.pipelineScore >= 1.0}
                badge={
                  computed.validation.pipelineScore >= 2.0 ? '매우 풍부'
                  : computed.validation.pipelineScore >= 1.0 ? '양호'
                  : '초기 단계'
                }
                tip="Phase 1=12%, Phase 2=30%, Phase 3=60%, FDA허가=90% 기반 합산. 수치가 높을수록 성숙한 파이프라인."
              />
              <WhyCard
                label="분석 시나리오 확률"
                value={`강세 ${computed.validation.bullPct}% · 약세 ${100 - computed.validation.bullPct}%`}
                highlight={computed.validation.bullPct >= 60}
                badge={computed.validation.bullPct >= 65 ? '강세 우세' : computed.validation.bullPct >= 50 ? '중립-강세' : '리스크 주의'}
                tip="파이프라인 임상 성숙도, 파트너 품질, 시장 환경, 특허 리스크를 종합한 자체 시나리오 확률."
              />
              <WhyCard
                label="역사적 연간 변동성(σ)"
                value={`${(computed.annualVol * 100).toFixed(0)}%`}
                highlight={false}
                badge={
                  computed.annualVol > 0.7 ? '고변동성'
                  : computed.annualVol > 0.4 ? '바이오 평균'
                  : '저변동성'
                }
                tip="1년 주봉 데이터 기반 연간 변동성. 시나리오 경로의 노이즈 폭을 결정. 바이오텍 평균 40~70%."
              />
            </div>
          </div>

          {/* ─ 마일스톤 리스트 ─ */}
          {computed.milestones.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                향후 촉매 이벤트 (차트 반영)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {computed.milestones.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '8px 12px', background: 'rgba(255,255,255,0.02)',
                    borderRadius: 8, borderLeft: `2px solid ${m.color}55`,
                  }}>
                    <span style={{
                      minWidth: 20, height: 20, borderRadius: '50%',
                      background: m.color + '20', border: `1px solid ${m.color}70`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: m.color, flexShrink: 0, marginTop: 1,
                    }}>{i + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#64748b' }}>
                          {m.date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
                        </span>
                        <span style={{
                          fontSize: 10, color: m.color,
                          background: m.color + '18', padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                        }}>{m.icon} {m.type}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 3, lineHeight: 1.5 }}>
                        {m.label}
                      </div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 3, display: 'flex', gap: 10 }}>
                        <span style={{ color: '#10b981' }}>강세 +{m.bull}%</span>
                        <span style={{ color: '#f59e0b' }}>기본 +{m.base}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 면책 */}
      <div style={{
        marginTop: 8, padding: '8px 12px',
        background: 'rgba(255,255,255,0.015)', borderRadius: 6,
        fontSize: 10, color: '#334155', lineHeight: 1.6,
        border: '1px solid rgba(255,255,255,0.04)',
      }}>
        ⚠️ 시나리오는 Jump-Diffusion + 박스권 모델 기반 추정치이며 투자 조언이 아닙니다.
        실제 주가는 다양한 외부 요인에 의해 예측과 크게 다를 수 있습니다.
      </div>
    </section>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function StatCard({ label, value, subValue, subColor }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10, padding: '10px 16px', minWidth: 130,
    }}>
      <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>{value}</div>
      {subValue && <div style={{ fontSize: 11, color: subColor || '#94a3b8', marginTop: 2 }}>{subValue}</div>}
    </div>
  );
}

function ScenarioCard({ label, pct, price, color, desc, prob }) {
  return (
    <div style={{
      background: color + '08', border: `1px solid ${color}28`,
      borderRadius: 10, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, letterSpacing: '-0.02em' }}>{pct}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>{fPrice(price)}</div>
      {prob != null && (
        <div style={{ fontSize: 10, color: color + 'aa', marginTop: 4 }}>확률 {prob}%</div>
      )}
      {desc && <div style={{ fontSize: 10, color: '#334155', marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
    </div>
  );
}

function WhyCard({ label, value, highlight, badge, tip }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{
        background: highlight ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${highlight ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8, padding: '10px 12px', position: 'relative', cursor: 'default',
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color: highlight ? '#10b981' : '#94a3b8' }}>{value}</div>
      {badge && (
        <div style={{
          display: 'inline-block', marginTop: 4,
          fontSize: 10, color: highlight ? '#10b981' : '#475569',
          background: highlight ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
          padding: '1px 7px', borderRadius: 10,
        }}>{badge}</div>
      )}
      {show && tip && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, zIndex: 99,
          background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, padding: '10px 12px', fontSize: 11, color: '#94a3b8',
          lineHeight: 1.6, maxWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
        }}>
          {tip}
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, solid, dashed, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <svg width={24} height={10}>
        {solid && <line x1={0} y1={5} x2={24} y2={5} stroke={color} strokeWidth={2} />}
        {dashed && <line x1={0} y1={5} x2={24} y2={5} stroke={color} strokeWidth={2} strokeDasharray="6 3" />}
      </svg>
      <span style={{ fontSize: 10, color: '#475569' }}>{label}</span>
    </div>
  );
}

const emptyStyle = {
  height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#334155', fontSize: 12, background: 'rgba(255,255,255,0.02)',
  borderRadius: 10, border: '1px dashed rgba(255,255,255,0.06)',
};
