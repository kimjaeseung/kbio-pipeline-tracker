import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import companies from '../data/companies.json';
import tagsData from '../data/tags.json';
import { PHASE_ORDER, PHASE_COLOR, CATEGORY_COLORS } from '../utils/constants';
import { countClinical, countApproved, getLeadPipeline } from '../utils/helpers';
import { getWatchlist } from '../utils/watchlist';
import CompanyCard from '../components/CompanyCard';
import FilterBar from '../components/FilterBar';
import UpcomingCatalysts from '../components/UpcomingCatalysts';
import AdSlot from '../components/AdSlot';

const totalPipelines = companies.reduce((s, c) => s + c.pipelines.length, 0);
const inClinical = countClinical(companies);
const approved = countApproved(companies);
const gameChangerCount = companies.filter(c =>
  c.pipelines.some(p => tagsData[p.drug]?.tags?.some(t => t.type === 'game-changer'))
).length;

// 기업별 태그 목록 계산
function getCompanyTags(company) {
  const tagSet = new Set();
  company.pipelines.forEach(p => {
    (tagsData[p.drug]?.tags || []).forEach(t => tagSet.add(t.type));
  });
  return tagSet;
}

// 태그 우선순위 (딱지 있는 기업이 상단)
function getTagPriority(company) {
  const tags = getCompanyTags(company);
  if (tags.has('game-changer')) return 10;
  if (tags.has('first-in-class')) return 8;
  if (tags.has('best-in-class')) return 7;
  if (tags.has('platform-expansion')) return 6;
  if (tags.has('first-mover')) return 5;
  if (tags.has('big-pharma-validated')) return 4;
  if (tags.has('unmet-need')) return 3;
  if (tags.has('watch')) return 1;
  return 0;
}

const TAG_FILTERS = [
  { key: 'all',                 label: '전체',         emoji: '' },
  { key: 'game-changer',        label: '게임체인저',    emoji: '🏆' },
  { key: 'first-in-class',      label: 'First-in-Class', emoji: '🆕' },
  { key: 'best-in-class',       label: 'Best-in-Class',  emoji: '🥇' },
  { key: 'platform-expansion',  label: '플랫폼 확장',   emoji: '🔗' },
  { key: 'big-pharma-validated',label: '빅파마 검증',   emoji: '🤝' },
  { key: 'unmet-need',          label: '미충족 수요',   emoji: '⚡' },
  { key: 'first-mover',         label: 'First Mover',  emoji: '🥇' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('전체');
  const [filterTag, setFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState('tag'); // 기본: 태그 우선 정렬
  const [view, setView] = useState('grid');
  const [tab, setTab] = useState('all');
  const [watchlistVersion, setWatchlistVersion] = useState(0);

  const watchlist = getWatchlist();

  // 각 태그별 기업 수 카운트
  const tagCounts = useMemo(() => {
    const counts = {};
    TAG_FILTERS.forEach(f => {
      if (f.key === 'all') {
        counts.all = companies.length;
      } else {
        counts[f.key] = companies.filter(c =>
          c.pipelines.some(p => tagsData[p.drug]?.tags?.some(t => t.type === f.key))
        ).length;
      }
    });
    return counts;
  }, []);

  const filtered = useMemo(() => {
    let list = tab === 'watchlist'
      ? companies.filter(c => watchlist.includes(c.id))
      : companies;

    if (filterCat !== '전체') list = list.filter(c => c.category === filterCat);

    // 태그 필터
    if (filterTag !== 'all') {
      list = list.filter(c =>
        c.pipelines.some(p => tagsData[p.drug]?.tags?.some(t => t.type === filterTag))
      );
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.includes(search) ||
        c.ticker.includes(search) ||
        c.pipelines.some(p =>
          p.drug.toLowerCase().includes(q) ||
          p.indication.includes(search) ||
          p.target.toLowerCase().includes(q)
        )
      );
    }

    const sorted = [...list];
    if (sortBy === 'tag') {
      // 태그 우선순위 → 같은 우선순위면 임상단계 내림차순
      sorted.sort((a, b) => {
        const pa = getTagPriority(a);
        const pb = getTagPriority(b);
        if (pb !== pa) return pb - pa;
        const ma = Math.max(...a.pipelines.map(p => PHASE_ORDER[p.phase] || 0));
        const mb = Math.max(...b.pipelines.map(p => PHASE_ORDER[p.phase] || 0));
        return mb - ma;
      });
    } else if (sortBy === 'phase') {
      sorted.sort((a, b) => {
        const ma = Math.max(...a.pipelines.map(p => PHASE_ORDER[p.phase] || 0));
        const mb = Math.max(...b.pipelines.map(p => PHASE_ORDER[p.phase] || 0));
        return mb - ma;
      });
    } else if (sortBy === 'pipeline') {
      sorted.sort((a, b) => b.pipelines.length - a.pipelines.length);
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
    return sorted;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCat, filterTag, search, sortBy, tab, watchlistVersion]);

  return (
    <div className="animate-fade-in">
      <Helmet>
        <title>K-Bio Pipeline Tracker | 국내 바이오텍 임상 파이프라인 분석</title>
        <meta name="description" content={`${companies.length}개 기업, ${totalPipelines}개 파이프라인의 임상 현황, 게임체인저 분석, 경쟁약 비교를 한눈에.`} />
        <meta property="og:title" content="K-Bio Pipeline Tracker | 국내 바이오텍 임상 파이프라인 분석" />
        <meta property="og:description" content={`${companies.length}개 기업 · ${totalPipelines}개 파이프라인 · 게임체인저 분석`} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
      </Helmet>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: '전체 파이프라인', value: totalPipelines, color: '#3b82f6' },
          { label: '임상 진입', value: inClinical, color: '#8b5cf6' },
          { label: '승인/허가', value: approved, color: '#10b981' },
          { label: '게임체인저 보유사', value: gameChangerCount, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: `${s.color}10`, border: `1px solid ${s.color}33`, padding: '12px 20px', borderRadius: 10, textAlign: 'center', minWidth: 120 }}>
            <div style={{ color: s.color, fontWeight: 800, fontSize: 24 }}>{s.value}</div>
            <div style={{ color: '#64748b', fontSize: 11 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming Catalysts */}
      <UpcomingCatalysts maxItems={4} />

      {/* Tab */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        <button
          onClick={() => setTab('all')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: tab === 'all' ? '#f1f5f9' : '#64748b', padding: '10px 16px', borderBottom: `2px solid ${tab === 'all' ? '#3b82f6' : 'transparent'}`, marginBottom: -1 }}
        >
          전체 기업
        </button>
        <button
          onClick={() => { setTab('watchlist'); setWatchlistVersion(v => v + 1); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: tab === 'watchlist' ? '#f59e0b' : '#64748b', padding: '10px 16px', borderBottom: `2px solid ${tab === 'watchlist' ? '#f59e0b' : 'transparent'}`, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ★ 관심 기업
          {watchlist.length > 0 && <span style={{ fontSize: 11, background: '#f59e0b22', color: '#f59e0b', padding: '1px 6px', borderRadius: 10 }}>{watchlist.length}</span>}
        </button>
      </div>

      {/* 태그 필터 pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TAG_FILTERS.map(f => {
          const count = tagCounts[f.key] || 0;
          const active = filterTag === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilterTag(f.key)}
              style={{
                background: active ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.1)'}`,
                color: active ? '#fbbf24' : '#94a3b8',
                borderRadius: 20,
                padding: '5px 14px',
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.15s',
              }}
            >
              {f.emoji && <span>{f.emoji}</span>}
              {f.label}
              <span style={{
                fontSize: 10,
                background: active ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
                color: active ? '#f59e0b' : '#64748b',
                padding: '1px 6px',
                borderRadius: 10,
                minWidth: 18,
                textAlign: 'center',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <FilterBar
        search={search} setSearch={setSearch}
        filterCat={filterCat} setFilterCat={setFilterCat}
        sortBy={sortBy} setSortBy={setSortBy}
        view={view} setView={setView}
      />

      <div style={{ marginBottom: 10, fontSize: 12, color: '#64748b' }}>
        {filtered.length}개 기업
        {filterTag !== 'all' && (
          <span style={{ marginLeft: 8, color: '#f59e0b' }}>
            · {TAG_FILTERS.find(f => f.key === filterTag)?.emoji} {TAG_FILTERS.find(f => f.key === filterTag)?.label} 필터 적용
          </span>
        )}
        {sortBy === 'tag' && filterTag === 'all' && (
          <span style={{ marginLeft: 8, color: '#64748b' }}>· 🏆 딱지 기업 우선 정렬</span>
        )}
      </div>

      {/* Watchlist empty state */}
      {tab === 'watchlist' && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>☆</div>
          <div style={{ fontSize: 16, color: '#94a3b8', marginBottom: 8 }}>관심 기업이 없습니다</div>
          <div style={{ fontSize: 13 }}>기업 카드의 ★ 버튼을 눌러 관심 기업을 추가하세요</div>
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16, animation: 'fadeIn 0.3s ease' }}>
          {filtered.map((c, i) => (
            <>
              <CompanyCard key={c.id} company={c} onWatchToggle={() => setWatchlistVersion(v => v + 1)} />
              {i === 7 && <div key="ad-mid" style={{ gridColumn: '1 / -1' }}><AdSlot format="in-feed" /></div>}
            </>
          ))}
        </div>
      )}
      <AdSlot format="horizontal" />

      {/* Table View */}
      {view === 'table' && filtered.length > 0 && (
        <div style={{ overflowX: 'auto', animation: 'fadeIn 0.3s ease' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['기업명', '딱지', '카테고리', '파이프라인', '리드 약물', '최고 임상단계', '주요 파트너', '누적 딜 규모'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const lead = getLeadPipeline(c.pipelines);
                const catColor = CATEGORY_COLORS[c.category] || '#64748b';
                const companyTags = getCompanyTags(c);
                const topTagEmoji = companyTags.has('game-changer') ? '🏆' :
                  companyTags.has('first-in-class') ? '🆕' :
                  companyTags.has('best-in-class') ? '🥇' :
                  companyTags.has('platform-expansion') ? '🔗' :
                  companyTags.has('big-pharma-validated') ? '🤝' :
                  companyTags.has('unmet-need') ? '⚡' : '';
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onClick={() => navigate(`/company/${c.id}`)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: '#f1f5f9' }}>
                      {c.name}
                      <span style={{ display: 'block', fontSize: 10, color: '#64748b', fontWeight: 400 }}>{c.ticker}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 16 }}>{topTagEmoji}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 10, color: catColor, background: catColor + '18', padding: '2px 7px', borderRadius: 3 }}>{c.category}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9', fontWeight: 600 }}>{c.pipelines.length}</td>
                    <td style={{ padding: '10px 12px', color: '#f1f5f9' }}>{lead?.drug || '-'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {lead && <span style={{ color: PHASE_COLOR(lead.phase), fontWeight: 700 }}>{lead.phase}</span>}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                      {c.partners.filter(p => !['자체', '자체 개발', '자체 개발 중심'].includes(p)).slice(0, 2).join(', ') || '자체 개발'}
                    </td>
                    <td style={{ padding: '10px 12px', color: c.totalDealValue !== '-' ? '#10b981' : '#475569' }}>
                      {c.totalDealValue}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
