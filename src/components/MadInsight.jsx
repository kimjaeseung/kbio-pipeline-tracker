import { useState } from 'react';
import madInsights from '../data/mad-insights.json';

export default function MadInsight({ drugName }) {
  const [expanded, setExpanded] = useState(true);
  const insight = madInsights[drugName];
  if (!insight) return null;

  return (
    <section style={{ marginBottom: 32 }}>
      {/* Header — clickable toggle */}
      <div
        onClick={() => setExpanded(v => !v)}
        style={{
          cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(245,158,11,0.08) 100%)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: expanded ? '12px 12px 0 0' : 12,
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔥</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24', letterSpacing: 0.3 }}>
              형이 알려주는 미친 포인트
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
              투자자 시각의 핵심 인사이트 — 클릭해서 펼치기
            </div>
          </div>
        </div>
        <span style={{ color: '#f59e0b', fontSize: 16, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▼
        </span>
      </div>

      {expanded && (
        <div style={{
          background: 'rgba(15,10,5,0.95)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '24px 20px',
        }}>
          {/* Why insane */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              🤯 이 약물이 왜 미쳤냐면
            </div>
            <p style={{
              fontSize: 14,
              color: '#e2e8f0',
              lineHeight: 1.85,
              margin: 0,
              borderLeft: '3px solid rgba(239,68,68,0.5)',
              paddingLeft: 14,
              fontStyle: 'italic',
            }}>
              "{insight.why_insane}"
            </p>
          </div>

          {/* VS Comparison Table */}
          {insight.vs_comparison && insight.vs_comparison.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
                📊 경쟁사 vs 이 약물
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
                      {['지표', '경쟁사', '이 약물', '우위'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {insight.vs_comparison.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 500 }}>{row.metric}</td>
                        <td style={{ padding: '10px 12px', color: '#64748b' }}>{row.them}</td>
                        <td style={{ padding: '10px 12px', color: row.winner === 'us' ? '#10b981' : '#cbd5e1', fontWeight: row.winner === 'us' ? 700 : 400 }}>
                          {row.us}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 16 }}>
                          {row.winner === 'us' ? '✅' : row.winner === 'neutral' ? '⚖️' : '⚠️'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Market Jackpot */}
          <div style={{
            marginBottom: 24,
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10,
            padding: '16px 20px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
              🔥 시장 파이 (TAM)
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', letterSpacing: -0.5, lineHeight: 1.3 }}>
              {insight.market_jackpot}
            </div>
          </div>

          {/* Two-column: Game Changer + Royalty */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                💥 왜 게임체인저인가
              </div>
              <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{insight.game_changer_point}</p>
            </div>
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
                💰 실제로 먹는 돈
              </div>
              <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{insight.royalty_logic}</p>
            </div>
          </div>

          {/* One-line vibe */}
          <div style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>🎯</span>
            <div>
              <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 3 }}>
                형의 마지막 한마디
              </div>
              <div style={{ fontSize: 13, color: '#fca5a5', fontWeight: 600, fontStyle: 'italic' }}>
                "{insight.one_line_vibe}"
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 10, color: '#475569', textAlign: 'center' }}>
            ⚠️ 투자 참고용 분석입니다. 투자 결정의 책임은 투자자 본인에게 있습니다.
          </div>
        </div>
      )}
    </section>
  );
}
