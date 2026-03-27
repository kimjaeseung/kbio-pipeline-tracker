import companyInsights from '../data/company-mad-insights.json';

export default function CompanyMadInsight({ companyId }) {
  const insight = companyInsights[companyId];
  if (!insight) return null;
  const view = insight.view;

  return (
    <section style={{ marginBottom: 32 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(245,158,11,0.07) 100%)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: '12px 12px 0 0',
        padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>🔥</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              형이 알려주는 미친 포인트
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
              {insight.headline}
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        {insight.key_metrics && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '16px 0' }}>
            {insight.key_metrics.map((m, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${m.color}33`,
                borderRadius: 8,
                padding: '10px 14px',
                textAlign: 'center',
                minWidth: 100,
              }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: m.color }}>{m.value}</div>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Why Insane */}
        <p style={{
          fontSize: 13,
          color: '#e2e8f0',
          lineHeight: 1.85,
          margin: '16px 0 0',
          borderLeft: '3px solid rgba(239,68,68,0.5)',
          paddingLeft: 14,
          fontStyle: 'italic',
        }}>
          "{insight.why_insane}"
        </p>
      </div>

      {/* Detail panels */}
      <div style={{
        background: 'rgba(10,8,5,0.97)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        padding: '20px 24px',
      }}>
        {/* VS Comparison Table */}
        {insight.vs_comparison?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              📊 경쟁사 vs 이 기업
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
                    {['지표', '경쟁사', '이 기업', '우위'].map(h => (
                      <th key={h} style={{ padding: '7px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {insight.vs_comparison.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '9px 12px', color: '#94a3b8', fontWeight: 500 }}>{row.metric}</td>
                      <td style={{ padding: '9px 12px', color: '#64748b' }}>{row.them}</td>
                      <td style={{ padding: '9px 12px', color: row.winner === 'us' ? '#10b981' : '#cbd5e1', fontWeight: row.winner === 'us' ? 700 : 400 }}>
                        {row.us}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'center', fontSize: 15 }}>
                        {row.winner === 'us' ? '✅' : row.winner === 'neutral' ? '⚖️' : '⚠️'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Game Changer + Royalty */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              💥 왜 게임체인저인가
            </div>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{insight.game_changer_point}</p>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              💰 수익 구조
            </div>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{insight.royalty_logic}</p>
          </div>
        </div>

        {/* TAM */}
        <div style={{
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 10,
          padding: '14px 18px',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
            🔥 시장 파이 (TAM)
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#fbbf24', lineHeight: 1.4 }}>
            {insight.market_jackpot}
          </div>
        </div>

        {/* Nightmare */}
        {insight.nightmare && (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '14px 18px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              ❄️ 냉정하게 리스크도 봐야지 (The Nightmare)
            </div>
            <p style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.75, margin: 0 }}>{insight.nightmare}</p>
          </div>
        )}

        {/* Conflict */}
        {insight.conflict && (
          <div style={{
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 10, padding: '14px 18px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              ⚖️ 시장이 싸우는 지점 (The Conflict)
            </div>
            <p style={{ fontSize: 12, color: '#c4b5fd', lineHeight: 1.75, margin: 0 }}>{insight.conflict}</p>
          </div>
        )}

        {/* Checkpoints */}
        {insight.checkpoints?.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              🎯 우리가 챙겨야 할 마일스톤 (Checkpoints)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {insight.checkpoints.map((cp, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)',
                  borderRadius: 7, padding: '8px 12px',
                }}>
                  <span style={{ color: '#34d399', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>→</span>
                  <span style={{ fontSize: 12, color: '#a7f3d0', lineHeight: 1.5 }}>{cp}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View — probability */}
        {view && (
          <div style={{
            background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(248,250,252,0.12)',
            borderRadius: 10, padding: '16px 18px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
              🧠 결론: 형의 확률적 판단 (The View)
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>🐂 낙관 {view.bull_pct}%</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>🐻 비관 {view.bear_pct}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${view.bull_pct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#10b981', marginBottom: 4, fontWeight: 600 }}>낙관 시나리오</div>
                <div style={{ fontSize: 11, color: '#d1fae5', lineHeight: 1.5 }}>{view.bull_case}</div>
                {view.expected_return && <div style={{ fontSize: 13, color: '#10b981', fontWeight: 800, marginTop: 6 }}>{view.expected_return}</div>}
              </div>
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 4, fontWeight: 600 }}>비관 시나리오</div>
                <div style={{ fontSize: 11, color: '#fee2e2', lineHeight: 1.5 }}>{view.bear_case}</div>
                {view.max_loss && <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 800, marginTop: 6 }}>{view.max_loss}</div>}
              </div>
            </div>
            {view.stage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <span style={{ color: '#64748b' }}>현재 위치:</span>
                <span style={{
                  background: view.stage === '초입' ? 'rgba(16,185,129,0.15)' : view.stage === '끝물' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: view.stage === '초입' ? '#10b981' : view.stage === '끝물' ? '#ef4444' : '#f59e0b',
                  padding: '2px 10px', borderRadius: 4, fontWeight: 700,
                }}>{view.stage}</span>
              </div>
            )}
          </div>
        )}

        {/* Market Expectation */}
        {insight.market_expectation && (
          <div style={{
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: 10, padding: '14px 18px', marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              📊 시장 기대 vs 현실
            </div>
            <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.75, margin: 0 }}>{insight.market_expectation}</p>
          </div>
        )}

        {/* One-line vibe */}
        <div style={{
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 8,
          padding: '11px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>🎯</span>
          <div>
            <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 2 }}>
              형의 마지막 한마디
            </div>
            <div style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600, fontStyle: 'italic' }}>
              "{insight.one_line_vibe}"
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 10, color: '#475569', textAlign: 'center' }}>
          ⚠️ 투자 참고용 분석입니다. 투자 결정의 책임은 투자자 본인에게 있습니다.
        </div>
      </div>
    </section>
  );
}
