import companyInsights from '../data/company-mad-insights.json';

export default function CompanyMadInsight({ companyId }) {
  const insight = companyInsights[companyId];
  if (!insight) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(245,158,11,0.07) 100%)',
        border: '1px solid rgba(239,68,68,0.3)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 0,
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
