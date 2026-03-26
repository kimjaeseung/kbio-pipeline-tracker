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

  // Find all unique tags for this company's pipelines
  const companyTags = company.pipelines.flatMap(p => {
    const tagInfo = tagsData[p.drug];
    return tagInfo ? tagInfo.tags : [];
  });
  const hasGameChanger = companyTags.some(t => t.type === 'game-changer');
  // Deduplicate by type, keeping highest confidence per type
  const uniqueTagsMap = new Map();
  companyTags.forEach(t => {
    if (!uniqueTagsMap.has(t.type) || (t.confidence || 0) > (uniqueTagsMap.get(t.type).confidence || 0)) {
      uniqueTagsMap.set(t.type, t);
    }
  });
  // Sort: game-changer first, then by type priority
  const TYPE_PRIORITY = { 'game-changer': 10, 'first-in-class': 8, 'best-in-class': 7, 'platform-expansion': 6, 'first-mover': 5, 'big-pharma-validated': 4, 'unmet-need': 3, 'watch': 1 };
  const uniqueTags = [...uniqueTagsMap.values()].sort((a, b) => (TYPE_PRIORITY[b.type] || 0) - (TYPE_PRIORITY[a.type] || 0));

  return (
    <div
      onClick={() => navigate(`/company/${company.id}`)}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${hasGameChanger ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 12, padding: 20, cursor: 'pointer',
        transition: 'all 0.2s ease',
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
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.name}</h3>
          <WatchButton id={company.id} size="sm" onToggle={onWatchToggle} />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, color: catColor, background: catColor + '18',
          padding: '3px 8px', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 8,
        }}>{company.category}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>{company.ticker} · {company.market}</span>
        {uniqueTags.slice(0, 3).map((t, i) => (
          <GameChangerBadge key={i} type={t.type} label={t.label} confidence={t.confidence} size="sm" />
        ))}
        {uniqueTags.length > 3 && (
          <span style={{ fontSize: 10, color: '#64748b', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>
            +{uniqueTags.length - 3}
          </span>
        )}
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
