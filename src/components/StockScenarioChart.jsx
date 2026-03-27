import { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts';

// ─── 파서 ────────────────────────────────────────────────────────────────────

function parseExpectedReturn(str) {
  if (!str || str.startsWith('N/A')) return null;
  const match = str.match(/\+?(\d+)~(\d+)%/);
  if (!match) return null;
  const yearMatch = str.match(/(\d+)년/);
  return { base: parseInt(match[1]), bull: parseInt(match[2]), years: yearMatch ? parseInt(yearMatch[1]) : 2 };
}

function parseMaxLoss(str) {
  if (!str || str.startsWith('N/A')) return null;
  const match = str.match(/-?(\d+)%/);
  return match ? parseInt(match[1]) : null;
}

function parseKoreanDate(str) {
  const yearMatch = str.match(/(\d{4})년/);
  const monthMatch = str.match(/(\d{1,2})월/);
  const dayMatch = str.match(/(\d{1,2})일/);
  if (!yearMatch || !monthMatch) return null;
  try {
    return new Date(parseInt(yearMatch[1]), parseInt(monthMatch[1]) - 1, dayMatch ? parseInt(dayMatch[1]) : 15);
  } catch { return null; }
}

// 억원/조원 문자열 → 원 단위 숫자
function parseDealKRW(str) {
  if (!str) return 0;
  const 조 = str.match(/(\d+(?:\.\d+)?)\s*조/);
  const 억 = str.match(/(\d[,\d]*)\s*억/);
  if (조) return parseFloat(조[1]) * 1e12;
  if (억) return parseInt(억[1].replace(/,/g, '')) * 1e8;
  return 0;
}

// ─── 포맷 ────────────────────────────────────────────────────────────────────

function formatYAxisKRW(price) {
  if (price >= 1000000) return `${Math.round(price / 10000)}만`;
  if (price >= 100000) return `${Math.round(price / 1000)}k`;
  if (price >= 10000) return `${(price / 10000).toFixed(1)}만`;
  return `${Math.round(price / 1000)}k`;
}

function formatKRWFull(price) {
  if (price >= 1e12) return `${(price / 1e12).toFixed(2)}조원`;
  if (price >= 1e8) return `${Math.round(price / 1e8)}억원`;
  if (price >= 1e4) return `${Math.round(price / 1e4)}만원`;
  return `${Math.round(price).toLocaleString()}원`;
}

function formatPriceLabel(price) {
  if (price >= 1000000) return `${(price / 10000).toFixed(0)}만원`;
  if (price >= 100000) return `${Math.round(price / 1000)}천원`;
  return `${Math.round(price).toLocaleString()}원`;
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear().toString().slice(2)}`;
}

// ─── 마일스톤 임팩트 분류 ────────────────────────────────────────────────────

function getMilestoneImpact(checkpoint) {
  const cp = checkpoint;
  if (/3상|phase 3|phase iii/i.test(cp)) return { bull: 0.50, base: 0.25, color: '#10b981', icon: '🔬', type: 'Phase 3 결과' };
  if (/2상|phase 2|phase ii/i.test(cp)) return { bull: 0.28, base: 0.13, color: '#60a5fa', icon: '🧪', type: 'Phase 2 결과' };
  if (/1상|phase 1|phase i/i.test(cp)) return { bull: 0.12, base: 0.06, color: '#a78bfa', icon: '💉', type: 'Phase 1 결과' };
  if (/fda|nda|bla|ema|허가|승인/i.test(cp)) return { bull: 0.65, base: 0.32, color: '#f59e0b', icon: '✅', type: '허가/승인' };
  if (/기술이전|l\/o|lo계약|계약 체결|딜|deal/i.test(cp)) return { bull: 0.35, base: 0.18, color: '#ec4899', icon: '🤝', type: '기술이전' };
  if (/로열티|royalty|수령|수입/i.test(cp)) return { bull: 0.22, base: 0.11, color: '#f97316', icon: '💰', type: '로열티 수령' };
  if (/kospi|코스피|이전/i.test(cp)) return { bull: 0.18, base: 0.09, color: '#8b5cf6', icon: '📈', type: '코스피 이전' };
  if (/결과|데이터|발표|asco|esmo|ash|학회|summit/i.test(cp)) return { bull: 0.20, base: 0.10, color: '#06b6d4', icon: '📊', type: '학회 발표' };
  return { bull: 0.08, base: 0.04, color: '#64748b', icon: '📌', type: '이벤트' };
}

// ─── 검증 지표 계산 ─────────────────────────────────────────────────────────

function calcValidation(company, insights, stockMeta) {
  const { marketCap } = stockMeta;

  // 1. 기술이전 누적 가치 (억 단위 → 원)
  const totalDealKRW = (company.dealHistory || []).reduce((sum, d) => {
    const up = (d.upfront || 0) * 1e8;
    const ms = (d.milestone || 0) * 1e8;
    return sum + up + ms;
  }, 0);

  // 2. 딜가치/시총 비율 (>1이면 딜 가치만으로도 시총 초과 → 저평가 신호)
  const dealToMarket = marketCap > 0 ? totalDealKRW / marketCap : 0;

  // 3. 임상단계 확률가중 점수
  const PHASE_PROBS = {
    'Preclinical': 0.05, 'Phase 1': 0.12, 'Phase 1/2': 0.18,
    'Phase 2': 0.30, 'Phase 2/3': 0.45, 'Phase 3': 0.60,
    'NDA/BLA Filed': 0.80, 'Approved': 0.90,
  };
  const pipelineScore = (company.pipelines || []).reduce((sum, p) => {
    return sum + (PHASE_PROBS[p.phase] || 0.10);
  }, 0);
  const pipelineCount = (company.pipelines || []).length;

  // 4. 분석가 확률
  const bullPct = insights?.view?.bull_pct || 50;

  return { totalDealKRW, dealToMarket, pipelineScore, pipelineCount, bullPct };
}

// ─── 시나리오 라인 생성 ──────────────────────────────────────────────────────

function buildScenarioLine(basePrice, futureMilestones, targetReturn1yr, endDate) {
  const today = new Date();
  const msPerDay = 86400000;
  const totalDays = (endDate - today) / msPerDay;
  const points = [];
  let current = new Date(today);

  // 각 마일스톤에 할당할 임팩트 (milestone에 담겨있는 bull/base)
  let cumulativeBump = 0;
  let milestoneIdx = 0;

  while (current <= endDate) {
    // 지나간 마일스톤 bump 누적
    while (
      milestoneIdx < futureMilestones.length &&
      futureMilestones[milestoneIdx].date <= current
    ) {
      cumulativeBump += futureMilestones[milestoneIdx].impact;
      milestoneIdx++;
    }

    const daysElapsed = (current - today) / msPerDay;
    const progress = totalDays > 0 ? daysElapsed / totalDays : 0;

    // 기본 성장 (non-milestone portion)
    const baseGrowth = targetReturn1yr * 0.55 * progress; // 55%는 기저 성장
    const totalReturn = baseGrowth + cumulativeBump;

    points.push({
      date: current.getTime(),
      price: basePrice * (1 + totalReturn / 100),
    });
    current = new Date(current.getTime() + 7 * msPerDay);
  }
  return points;
}

// ─── CustomDot: 오늘 기준점 표시 ─────────────────────────────────────────────

function TodayDot(props) {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <circle cx={cx} cy={cy} r={5} fill="#60a5fa" stroke="#1e293b" strokeWidth={2} />
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function StockScenarioChart({ company, insights }) {
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const returnData = parseExpectedReturn(insights?.view?.expected_return);
  const maxLoss = parseMaxLoss(insights?.view?.max_loss);

  useEffect(() => {
    if (!company.id || !returnData) { setLoading(false); return; }

    fetch('/stock-data.json')
      .then(r => { if (!r.ok) throw new Error('없음'); return r.json(); })
      .then(json => {
        const d = json?.data?.[company.id];
        if (!d || !d.prices || d.prices.length === 0) throw new Error('데이터 없음');
        setStockData(d);
        setLoading(false);
      })
      .catch(() => { setApiError(true); setLoading(false); });
  }, [company.id]); // eslint-disable-line

  // ─── 차트 데이터 & 시나리오 계산 ──────────────────────────────────────────

  const { chartData, futureMilestones, validation } = useMemo(() => {
    if (!returnData || !stockData) return { chartData: [], futureMilestones: [], validation: null };

    const prices = stockData.prices || [];
    const marketCap = stockData.marketCap || 0;
    const sharesOutstanding = stockData.sharesOutstanding || 0;
    const stockMeta = { marketCap, sharesOutstanding };

    const today = new Date();
    const oneYearLater = new Date(today); oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    const currentPrice = prices[prices.length - 1]?.price || 0;
    if (currentPrice === 0) return { chartData: [], futureMilestones: [], validation: null };

    const validation = calcValidation(company, insights, stockMeta);

    // 미래 마일스톤 파싱 + 임팩트 계산
    const checkpoints = insights?.checkpoints || [];
    const allMilestones = checkpoints.map((cp, idx) => {
      const date = parseKoreanDate(cp);
      if (!date || date <= today || date > oneYearLater) return null;
      const impact = getMilestoneImpact(cp);
      const label = cp.split(':')[0].trim();
      return { date, label, impact: impact.bull, baseImpact: impact.base, color: impact.color, icon: impact.icon, type: impact.type, num: idx + 1, full: cp };
    }).filter(Boolean).sort((a, b) => a.date - b.date);

    // 시나리오 수익률: 연간 기준
    const periodYears = returnData.years || 2;
    const bull1yr = returnData.bull / periodYears;
    const base1yr = returnData.base / periodYears;

    // 실제 주가 포인트
    const histPoints = prices.map(d => ({ date: d.date, actual: d.price, bull: null, base: null }));

    // 시나리오 라인
    const bullLine = buildScenarioLine(currentPrice, allMilestones.map(m => ({ date: m.date, impact: m.impact })), bull1yr, oneYearLater);
    const baseLine = buildScenarioLine(currentPrice, allMilestones.map(m => ({ date: m.date, impact: m.baseImpact })), base1yr, oneYearLater);

    const forecastMap = new Map();
    bullLine.forEach(p => forecastMap.set(p.date, { bull: p.price }));
    baseLine.forEach(p => {
      const e = forecastMap.get(p.date) || {};
      forecastMap.set(p.date, { ...e, base: p.price });
    });
    const forecastPoints = [...forecastMap.entries()].map(([date, v]) => ({ date, actual: null, bull: v.bull || null, base: v.base || null }));

    const junction = { date: today.getTime(), actual: currentPrice, bull: currentPrice, base: currentPrice };
    const combined = [...histPoints, junction, ...forecastPoints].sort((a, b) => a.date - b.date);

    return { chartData: combined, futureMilestones: allMilestones, validation };
  }, [stockData, insights, returnData, company]); // eslint-disable-line

  if (!returnData) return null;

  const currentPrice = stockData?.prices?.[stockData.prices.length - 1]?.price || 0;
  const firstPrice = stockData?.prices?.[0]?.price || 0;
  const priceChange1yr = currentPrice && firstPrice ? ((currentPrice - firstPrice) / firstPrice) * 100 : null;
  const periodYears = returnData.years || 2;
  const bull1yr = Math.round(returnData.bull / periodYears);
  const base1yr = Math.round(returnData.base / periodYears);
  const today = new Date().getTime();

  const marketCap = stockData?.marketCap || 0;

  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8,
        display: 'flex', alignItems: 'baseline', gap: 10,
      }}>
        주가 시나리오 분석
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>
          금융위원회 실제 주가(1년) · SOTP 기반 시나리오
        </span>
      </h2>

      {/* ─── 현재가 + 수익률 + 시총 ─── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {currentPrice > 0 && (
          <div style={cardStyle('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)')}>
            <div style={cardLabel}>현재 주가</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>{formatPriceLabel(currentPrice)}</div>
          </div>
        )}
        {priceChange1yr !== null && (
          <div style={cardStyle('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)')}>
            <div style={cardLabel}>1년 수익률</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: priceChange1yr >= 0 ? '#10b981' : '#ef4444' }}>
              {priceChange1yr >= 0 ? '+' : ''}{priceChange1yr.toFixed(1)}%
            </div>
          </div>
        )}
        {marketCap > 0 && (
          <div style={cardStyle('rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)')}>
            <div style={cardLabel}>현재 시총</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#94a3b8' }}>{formatKRWFull(marketCap)}</div>
          </div>
        )}
      </div>

      {/* ─── 시나리오 카드 ─── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={cardStyle('rgba(16,185,129,0.06)', 'rgba(16,185,129,0.2)')}>
          <div style={cardLabel}>강세 시나리오 (1년)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>+{bull1yr}%</div>
          {currentPrice > 0 && (
            <div style={{ fontSize: 11, color: '#064e3b', marginTop: 2 }}>
              목표가 {formatPriceLabel(currentPrice * (1 + bull1yr / 100))}
            </div>
          )}
        </div>
        <div style={cardStyle('rgba(245,158,11,0.06)', 'rgba(245,158,11,0.2)')}>
          <div style={cardLabel}>기본 시나리오 (1년)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>+{base1yr}%</div>
          {currentPrice > 0 && (
            <div style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>
              목표가 {formatPriceLabel(currentPrice * (1 + base1yr / 100))}
            </div>
          )}
        </div>
        {maxLoss && (
          <div style={cardStyle('rgba(239,68,68,0.06)', 'rgba(239,68,68,0.15)')}>
            <div style={cardLabel}>약세 시나리오 (최대손실)</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>-{maxLoss}%</div>
            {currentPrice > 0 && (
              <div style={{ fontSize: 11, color: '#7f1d1d', marginTop: 2 }}>
                하방 {formatPriceLabel(currentPrice * (1 - maxLoss / 100))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 예측 근거 (Why) ─── */}
      {validation && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 8, marginBottom: 12,
        }}>
          {validation.totalDealKRW > 0 && (
            <WhyCard
              label="기술이전 가치"
              value={formatKRWFull(validation.totalDealKRW)}
              sub={marketCap > 0 ? `시총의 ${(validation.dealToMarket * 100).toFixed(0)}%` : null}
              highlight={validation.dealToMarket >= 0.5}
              tip={validation.dealToMarket >= 1
                ? '딜 가치가 시총 초과 → 플랫폼 가치 미반영 상태'
                : validation.dealToMarket >= 0.5
                  ? '딜 가치가 시총의 절반 이상 → 파이프라인 옵션 가치 존재'
                  : '딜 가치 대비 시총 높음 → 성공 기대감 선반영 중'}
            />
          )}
          <WhyCard
            label="임상 확률가중 파이프라인"
            value={`${validation.pipelineScore.toFixed(1)}점`}
            sub={`${validation.pipelineCount}개 파이프라인`}
            highlight={validation.pipelineScore >= 1.0}
            tip="각 파이프라인 임상단계의 FDA 업계 평균 성공확률 합산 (Phase 1=12%, Phase 2=30%, Phase 3=60%)"
          />
          <WhyCard
            label="분석 확률"
            value={`강세 ${validation.bullPct}% · 약세 ${100 - validation.bullPct}%`}
            sub="자체 분석 기반"
            highlight={validation.bullPct >= 60}
            tip="파이프라인 성숙도, 파트너 퀄리티, 시장 환경을 종합한 시나리오 확률"
          />
        </div>
      )}

      {/* ─── 차트 ─── */}
      {loading ? (
        <div style={emptyBox}>주가 데이터 로딩 중...</div>
      ) : apiError || chartData.length === 0 ? (
        <div style={{ ...emptyBox, flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 20 }}>📡</span>
          주가 데이터 없음 — npm run fetch-stocks 실행 후 재배포
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '16px 4px 8px' }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date" type="number" scale="time"
                domain={['dataMin', 'dataMax']} tickFormatter={formatDate}
                tick={{ fill: '#475569', fontSize: 10 }} tickCount={12}
              />
              <YAxis
                tickFormatter={formatYAxisKRW}
                tick={{ fill: '#475569', fontSize: 10 }} width={50}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (value == null) return [null, null];
                  const labels = { actual: '실제 주가', bull: `강세 시나리오 (+${bull1yr}%/1yr)`, base: `기본 시나리오 (+${base1yr}%/1yr)` };
                  return [formatPriceLabel(value), labels[name] || name];
                }}
                labelFormatter={v => new Date(v).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#94a3b8', marginBottom: 4 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={value => {
                  const labels = { actual: '실제 주가 (금융위원회)', bull: `강세 (+${bull1yr}%/1yr)`, base: `기본 (+${base1yr}%/1yr)` };
                  return <span style={{ color: '#94a3b8' }}>{labels[value] || value}</span>;
                }}
              />

              {/* 오늘 구분선 */}
              <ReferenceLine x={today} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3"
                label={{ value: '오늘', position: 'insideTopLeft', fill: '#64748b', fontSize: 10, dy: -2 }}
              />

              {/* 마일스톤 번호 마커 */}
              {futureMilestones.map((m, i) => (
                <ReferenceLine
                  key={i}
                  x={m.date.getTime()}
                  stroke={m.color + '60'}
                  strokeDasharray="2 4"
                  strokeWidth={1.5}
                  label={<MilestoneLabel num={i + 1} color={m.color} />}
                />
              ))}

              {/* 실제 주가 */}
              <Line dataKey="actual" stroke="#60a5fa" strokeWidth={2} dot={false} name="actual" connectNulls={false} activeDot={{ r: 4, fill: '#60a5fa' }} />
              {/* 강세 시나리오 */}
              <Line dataKey="bull" stroke="#10b981" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="bull" connectNulls={false} />
              {/* 기본 시나리오 */}
              <Line dataKey="base" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="base" connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── 마일스톤 리스트 ─── */}
      {futureMilestones.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 6, fontWeight: 600 }}>
            향후 주요 촉매 이벤트
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {futureMilestones.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '6px 10px', background: 'rgba(255,255,255,0.02)',
                borderRadius: 6, borderLeft: `2px solid ${m.color}50`,
              }}>
                <span style={{
                  minWidth: 20, height: 20, borderRadius: '50%',
                  background: m.color + '20', border: `1px solid ${m.color}60`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: m.color, flexShrink: 0, marginTop: 1,
                }}>{i + 1}</span>
                <div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {m.date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' })}
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6,
                    background: m.color + '18', padding: '1px 5px', borderRadius: 3 }}>
                    {m.icon} {m.type}
                  </span>
                  <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 2 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                    강세 +{m.impact.toFixed(0)}% · 기본 +{m.baseImpact.toFixed(0)}% 반영
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 면책 */}
      <div style={{
        marginTop: 10, padding: '8px 12px',
        background: 'rgba(255,255,255,0.02)', borderRadius: 6,
        fontSize: 10, color: '#475569', lineHeight: 1.6,
        border: '1px solid rgba(255,255,255,0.04)',
      }}>
        ⚠️ 시나리오는 자체 인사이트 분석(SOTP, 임상단계 확률가중, 기술이전 가치) 기반 추정치이며 투자 조언이 아닙니다.
        실제 주가는 다양한 외부 요인에 의해 크게 달라질 수 있으며, 투자 판단의 책임은 투자자 본인에게 있습니다.
      </div>
    </section>
  );
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────────────────

function MilestoneLabel({ viewBox, num, color }) {
  if (!viewBox) return null;
  const { x, y } = viewBox;
  return (
    <g>
      <rect x={x - 9} y={y + 4} width={18} height={14} rx={7} fill={color + '25'} stroke={color + '80'} strokeWidth={0.8} />
      <text x={x} y={y + 14} textAnchor="middle" fill={color} fontSize={8} fontWeight={700}>{num}</text>
    </g>
  );
}

function WhyCard({ label, value, sub, highlight, tip }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div
      style={{
        background: highlight ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${highlight ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8, padding: '10px 12px', position: 'relative', cursor: 'help',
      }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? '#10b981' : '#94a3b8' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{sub}</div>}
      {showTip && tip && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 50,
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#94a3b8',
          lineHeight: 1.5, maxWidth: 260, whiteSpace: 'pre-wrap', boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {tip}
        </div>
      )}
    </div>
  );
}

// ─── 스타일 헬퍼 ─────────────────────────────────────────────────────────────

function cardStyle(bg, border) {
  return {
    background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 16px',
    minWidth: 120,
  };
}

const cardLabel = { fontSize: 10, color: '#64748b', marginBottom: 2 };

const emptyBox = {
  height: 120, background: 'rgba(255,255,255,0.02)', borderRadius: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#475569', fontSize: 12, border: '1px dashed rgba(255,255,255,0.08)',
};
