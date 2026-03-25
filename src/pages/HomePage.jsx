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
import PipelineTimeline from '../components/PipelineTimeline';
import RecentUpdates from '../components/RecentUpdates';
import AdSlot from '../components/AdSlot';

const totalPipelines = companies.reduce((s, c) => s + c.pipelines.length, 0);
const inClinical = countClinical(companies);
const approved = countApproved(companies);
const gameChangerCount = companies.filter(c =>
  c.pipelines.some(p => tagsData[p.drug]?.tags?.some(t => t.type === 'game-changer'))
).length;

export default function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('전체');
  const [sortBy, setSortBy] = useState('phase');
  const [view, setView] = useState('grid');
  const [tab, setTab] = useState('all'); // 'all' | 'watchlist'
  const [watchlistVersion, setWatchlistVersion] = useState(0); // force re-render

  const watchlist = getWatchlist();

  const filtered = useMemo(() => {
    let list = tab === 'watchlist'
      ? companies.filter(c => watchlist.includes(c.id))
      : companies;

    if (filterCat !== '전체') list = list.filter(c => c.category === filterCat);
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
    if (sortBy === 'phase') {
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
  }, [filterCat, search, sortBy, tab, watchlistVersion]);

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

      {/* Recent Updates */}
      <RecentUpdates maxItems={5} />

      {/* Upcoming Catalysts */}
      <UpcomingCatalysts maxItems={4} />

      {/* Tab + Filter */}
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

      <FilterBar
        search={search} setSearch={setSearch}
        filterCat={filterCat} setFilterCat={setFilterCat}
        sortBy={sortBy} setSortBy={setSortBy}
        view={view} setView={setView}
      />

      <div style={{ marginBottom: 10, fontSize: 12, color: '#64748b' }}>
        {filtered.length}개 기업
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
                {['기업명', '카테고리', '파이프라인', '리드 약물', '최고 임상단계', '주요 파트너', '누적 딜 규모'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const lead = getLeadPipeline(c.pipelines);
                const catColor = CATEGORY_COLORS[c.category] || '#64748b';
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
