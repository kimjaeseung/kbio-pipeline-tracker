import { useParams, useNavigate } from 'react-router-dom';
import companies from '../data/companies.json';
import tagsData from '../data/tags.json';
import { PHASE_COLOR, CATEGORY_COLORS } from '../utils/constants';
import { drugToSlug } from '../utils/helpers';
import PipelineTimeline from '../components/PipelineTimeline';
import GameChangerBadge from '../components/GameChangerBadge';
import PhaseBar from '../components/PhaseBar';
import WatchButton from '../components/WatchButton';
import CompanyEventTimeline from '../components/CompanyEventTimeline';

export default function CompanyPage() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const company = companies.find(c => c.id === companyId);

  if (!company) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, color: '#94a3b8' }}>기업을 찾을 수 없습니다</div>
        <button
          onClick={() => navigate('/')}
          style={{ marginTop: 16, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', color: '#3b82f6', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[company.category] || '#64748b';
  const realPartners = company.partners.filter(p => !['자체', '자체 개발', '자체 개발 중심'].includes(p));

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
          fontSize: 12, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        ← 목록으로
      </button>

      {/* Company Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: -0.5 }}>{company.name}</h1>
          <WatchButton id={company.id} size="md" />
          <span style={{ fontSize: 12, fontWeight: 600, color: catColor, background: catColor + '18', padding: '4px 10px', borderRadius: 5 }}>
            {company.category}
          </span>
        </div>
        <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 4px' }}>
          {company.ticker} · {company.market} · {company.platform}
        </p>
        <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 20px', lineHeight: 1.7, maxWidth: 700 }}>
          {company.description}
        </p>

        {/* Partners & Deal */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {realPartners.map((p, i) => (
            <span key={i} style={{ fontSize: 11, color: '#e2e8f0', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
              🤝 {p}
            </span>
          ))}
          {company.totalDealValue !== '-' && (
            <span style={{ fontSize: 11, color: '#10b981', background: '#10b98118', padding: '4px 10px', borderRadius: 4 }}>
              💰 {company.totalDealValue}
            </span>
          )}
        </div>
      </div>

      {/* Pipeline Timeline */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
          파이프라인 타임라인
        </h2>
        <PipelineTimeline
          pipelines={company.pipelines}
          onDrugClick={(p) => navigate(`/pipeline/${drugToSlug(p.drug)}`)}
        />
      </section>

      {/* Pipeline Detail Table */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
          임상 파이프라인 상세
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['약물', '타겟', '적응증', '기전(MoA)', '임상단계', '파트너', '태그', '비고'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#64748b', fontWeight: 500, fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {company.pipelines.map((p, i) => {
                const pipelineTags = tagsData[p.drug]?.tags || [];
                return (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onClick={() => navigate(`/pipeline/${drugToSlug(p.drug)}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px', fontWeight: 700, color: '#f1f5f9' }}>{p.drug}</td>
                    <td style={{ padding: '10px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{p.target}</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>{p.indication}</td>
                    <td style={{ padding: '10px', color: '#94a3b8', fontSize: 11 }}>{p.moa}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{
                        color: PHASE_COLOR(p.phase), fontWeight: 700, fontSize: 11,
                        background: PHASE_COLOR(p.phase) + '18', padding: '2px 8px', borderRadius: 3,
                      }}>{p.phase}</span>
                    </td>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{p.partner}</td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {pipelineTags.map((t, j) => (
                          <GameChangerBadge key={j} type={t.type} label={t.label} confidence={t.confidence} size="sm" />
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '10px', color: '#64748b', fontSize: 11, maxWidth: 200 }}>{p.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Phase bar for each pipeline */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
          임상 단계 현황
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {company.pipelines.map((p, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 12 }}>
              <span
                style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onClick={() => navigate(`/pipeline/${drugToSlug(p.drug)}`)}
                title={p.drug}
              >
                {p.drug}
              </span>
              <PhaseBar phase={p.phase} />
            </div>
          ))}
        </div>
      </section>

      {/* Company Event Timeline */}
      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
          주요 이벤트 & 촉매
        </h2>
        <CompanyEventTimeline companyId={company.id} />
      </section>
    </div>
  );
}
