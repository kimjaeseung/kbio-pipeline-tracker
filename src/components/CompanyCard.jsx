import { useNavigate } from 'react-router-dom';
import { PHASE_ORDER, PHASE_COLOR, CATEGORY_COLORS } from '../utils/constants';
import { getLeadPipeline } from '../utils/helpers';
import PipelineTimeline from './PipelineTimeline';
import GameChangerBadge from './GameChangerBadge';
import WatchButton from './WatchButton';
import tagsData from '../data/tags.json';

export default function CompanyCard({ company, onWatchToggle }) {
  const navigate = useNavigate();
  const leadPipeline = getLeadPipeline(company.pipelines);
  const catColor = CATEGORY_COLORS[company.category] || '#64748b';

  // Find tags for this company's pipelines
  const companyTags = company.pipelines.flatMap(p => {
    const tagInfo = tagsData[p.drug];
    return tagInfo ? tagInfo.tags : [];
  });
  const hasGameChanger = companyTags.some(t => t.type === 'game-changer');
  const uniqueTypes = [...new Set(companyTags.map(t => t.type))].slice(0, 2);

  return (
    <div
      onClick={() => navigate(`/company/${company.id}`)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${hasGameChanger ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12, padding: 20, cursor: 'pointer',
        transition: 'all 0.2s ease', position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.borderColor = catColor + '66';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = hasGameChanger ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top-right: Watch + Tag badges */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <WatchButton id={company.id} size="sm" onToggle={onWatchToggle} />
        {uniqueTypes.map((type, i) => {
          const tag = companyTags.find(t => t.type === type);
          return <GameChangerBadge key={i} type={type} label={tag.label} confidence={tag.confidence} size="sm" />;
        })}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingRight: 80 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{company.name}</h3>
          <span style={{ fontSize: 11, color: '#64748b' }}>{company.ticker} · {company.market}</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, color: catColor, background: catColor + '18',
          padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0,
        }}>{company.category}</span>
      </div>

      {/* Description */}
      <p style={{
        fontSize: 12, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {company.description}
      </p>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 11 }}>
        <div>
          <span style={{ color: '#64748b' }}>파이프라인 </span>
          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{company.pipelines.length}개</span>
        </div>
        {leadPipeline && (
          <div>
            <span style={{ color: '#64748b' }}>리드 </span>
            <span style={{ color: PHASE_COLOR(leadPipeline.phase), fontWeight: 700 }}>{leadPipeline.phase}</span>
          </div>
        )}
        {company.partners.length > 0 && !['자체', '자체 개발', '자체 개발 중심'].includes(company.partners[0]) && (
          <div>
            <span style={{ color: '#64748b' }}>파트너 </span>
            <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
              {company.partners[0]}{company.partners.length > 1 ? ` +${company.partners.length - 1}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Mini Timeline */}
      <PipelineTimeline pipelines={company.pipelines.slice(0, 4)} />
    </div>
  );
}
