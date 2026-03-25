import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import companies from '../data/companies.json';
import clinicalData from '../data/clinical-evidence.json';
import tagsData from '../data/tags.json';
import pipelineHistory from '../data/pipeline-history.json';
import { PHASE_COLOR, CATEGORY_COLORS } from '../utils/constants';
import { findPipelineBySlug, drugToSlug } from '../utils/helpers';
import GameChangerBadge from '../components/GameChangerBadge';
import CompetitorCompare from '../components/CompetitorCompare';
import PhaseBar from '../components/PhaseBar';
import WatchButton from '../components/WatchButton';
import AdSlot from '../components/AdSlot';

const IMPACT_STYLES = {
  positive: { border: '#10b981', bg: 'rgba(16,185,129,0.06)', dot: '#10b981', label: '긍정' },
  negative: { border: '#ef4444', bg: 'rgba(239,68,68,0.06)', dot: '#ef4444', label: '부정' },
  neutral:  { border: '#64748b', bg: 'rgba(100,116,139,0.06)', dot: '#94a3b8', label: '중립' },
};

function EndpointCard({ label, value, unit, description, highlight }) {
  return (
    <div style={{
      background: highlight ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${highlight ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10,
      padding: '16px 20px',
      textAlign: 'center',
      minWidth: 120,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: highlight ? '#3b82f6' : '#f1f5f9', letterSpacing: -1 }}>
        {value}{unit}
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{description || label}</div>
    </div>
  );
}

export default function PipelinePage() {
  const { drugId } = useParams();
  const navigate = useNavigate();

  const result = findPipelineBySlug(companies, drugId);
  if (!result) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔬</div>
        <div style={{ fontSize: 18, color: '#94a3b8' }}>약물 정보를 찾을 수 없습니다</div>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: 16, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#3b82f6', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const { company, pipeline } = result;
  const catColor = CATEGORY_COLORS[company.category] || '#64748b';
  const phaseColor = PHASE_COLOR(pipeline.phase);
  const tags = tagsData[pipeline.drug]?.tags || [];
  const evidence = clinicalData[pipeline.drug];

  const topTag = tags[0];
  const descParts = [
    `${pipeline.drug} ${pipeline.phase} - ${pipeline.indication}.`,
    topTag ? `${topTag.label}.` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>{pipeline.drug} ({company.name}) 임상 분석 | K-Bio Pipeline Tracker</title>
        <meta name="description" content={descParts} />
        <meta property="og:title" content={`${pipeline.drug} | ${company.name} | K-Bio Pipeline Tracker`} />
        <meta property="og:description" content={descParts} />
      </Helmet>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, fontSize: 12, color: '#64748b' }}>
        <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => navigate('/')}>홈</span>
        <span>/</span>
        <span style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => navigate(`/company/${company.id}`)}>
          {company.name}
        </span>
        <span>/</span>
        <span style={{ color: '#f1f5f9' }}>{pipeline.drug}</span>
      </div>

      {/* Back button */}
      <button
        onClick={() => navigate(`/company/${company.id}`)}
        style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
          fontSize: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        ← {company.name}으로
      </button>

      {/* Drug Header */}
      <div style={{ marginBottom: 28 }}>
        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {tags.map((t, i) => (
              <GameChangerBadge key={i} type={t.type} label={t.label} confidence={t.confidence} size="sm" />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: -0.5 }}>
            {pipeline.drug}
          </h1>
          <WatchButton id={`${company.id}-${pipeline.drug}`} size="md" />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{company.name}</span>
          <span style={{ color: '#475569' }}>·</span>
          <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{pipeline.target}</span>
          <span style={{ color: '#475569' }}>·</span>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{pipeline.indication}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: phaseColor, background: phaseColor + '18', padding: '3px 10px', borderRadius: 4, fontWeight: 700 }}>
            {pipeline.phase}
          </span>
          {pipeline.partner && pipeline.partner !== '자체' && (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>파트너: {pipeline.partner}</span>
          )}
          <span style={{ fontSize: 12, color: '#64748b' }}>기전: {pipeline.moa}</span>
        </div>
      </div>

      {/* Phase Bar */}
      <div style={{ marginBottom: 32, maxWidth: 400 }}>
        <PhaseBar phase={pipeline.phase} />
      </div>

      {/* Game Changer Cards */}
      {tags.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
            경쟁력 분석
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tags.map((t, i) => (
              <GameChangerBadge
                key={i}
                type={t.type}
                label={t.label}
                confidence={t.confidence}
                reason={t.reason}
                evidence={t.evidence}
                size="lg"
                defaultExpanded
              />
            ))}
          </div>
        </section>
      )}

      {/* Clinical Evidence */}
      {evidence && evidence.previousResults && evidence.previousResults.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
            임상 결과
          </h2>
          {evidence.previousResults.map((result, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}>
              {/* Result Header */}
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{result.phase}</span>
                <span style={{ fontSize: 12, color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  {result.conference}
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{result.date}</span>
                {result.patientCount && (
                  <span style={{ fontSize: 12, color: '#64748b' }}>n={result.patientCount}</span>
                )}
              </div>

              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>처방: </span>
                <span style={{ fontSize: 12, color: '#cbd5e1' }}>{result.regimen}</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>적응증: </span>
                <span style={{ fontSize: 12, color: '#cbd5e1' }}>{result.indication}</span>
              </div>

              {/* Endpoint Cards */}
              {result.endpoints && Object.keys(result.endpoints).length > 0 && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                  {Object.entries(result.endpoints).map(([key, ep], j) => (
                    <EndpointCard
                      key={key}
                      label={key}
                      value={ep.value}
                      unit={ep.unit}
                      description={ep.description}
                      highlight={j === 0}
                    />
                  ))}
                </div>
              )}

              {result.summary && (
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: 0, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
                  {result.summary}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      <AdSlot format="in-feed" />

      {/* Competitor Comparison */}
      {evidence?.competitorComparison && evidence.competitorComparison.competitors.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
            경쟁약 비교
          </h2>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
            {evidence.competitorComparison.sameTarget}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
            <CompetitorCompare
              mainDrug={{
                name: pipeline.drug,
                company: company.name,
                phase: pipeline.phase,
                endpoints: evidence.previousResults?.[0]?.endpoints || {},
              }}
              competitors={evidence.competitorComparison.competitors}
              endpointsToCompare={Object.keys(evidence.previousResults?.[0]?.endpoints || {})}
            />
          </div>
        </section>
      )}

      {/* Pipeline note */}
      {pipeline.note && (
        <section style={{ marginBottom: 32 }}>
          <div style={{
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 13,
            color: '#94a3b8',
            lineHeight: 1.7,
          }}>
            💡 {pipeline.note}
          </div>
        </section>
      )}

      {/* Competitor Insights */}
      {tagsData[pipeline.drug]?.competitorInsights?.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
            경쟁 동향
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tagsData[pipeline.drug].competitorInsights.map((ins, i) => {
              const style = IMPACT_STYLES[ins.impact] || IMPACT_STYLES.neutral;
              return (
                <div key={i} style={{
                  background: style.bg,
                  border: `1px solid ${style.border}44`,
                  borderLeft: `3px solid ${style.border}`,
                  borderRadius: 8,
                  padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{ins.date}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{ins.competitor}</span>
                    <span style={{ fontSize: 11, color: '#cbd5e1', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4 }}>{ins.event}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: style.dot, background: style.bg, padding: '2px 8px', borderRadius: 4 }}>{style.label}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>{ins.analysis}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pipeline History */}
      {pipelineHistory[pipeline.drug]?.history?.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
            개발 히스토리
          </h2>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 1, background: 'rgba(255,255,255,0.08)' }} />
            {pipelineHistory[pipeline.drug].history.map((item, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
                <div style={{
                  position: 'absolute', left: -24, top: 4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: item.highlight ? '#3b82f6' : '#334155',
                  border: item.highlight ? '2px solid #60a5fa' : '2px solid #475569',
                  boxShadow: item.highlight ? '0 0 8px rgba(59,130,246,0.5)' : 'none',
                }} />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{item.date}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: item.highlight ? '#60a5fa' : '#64748b', background: item.highlight ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 3 }}>
                    {item.phase}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: item.highlight ? '#e2e8f0' : '#94a3b8', margin: 0, lineHeight: 1.6, fontWeight: item.highlight ? 500 : 400 }}>
                  {item.event}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No data placeholder */}
      {(!evidence || !evidence.previousResults || evidence.previousResults.length === 0) && tags.length === 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 40,
          textAlign: 'center',
          color: '#64748b',
          marginBottom: 32,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔬</div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 8 }}>임상 데이터 수집 중</div>
          <div style={{ fontSize: 12 }}>이 약물의 임상 결과 데이터는 아직 공개되지 않았거나 수집 중입니다.</div>
        </div>
      )}
    </div>
  );
}
