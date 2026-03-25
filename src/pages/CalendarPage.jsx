import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import catalysts from '../data/catalysts.json';
import conferences from '../data/conferences.json';
import companies from '../data/companies.json';
import { getDDay, formatDDay, formatDisplayDate } from '../utils/dateUtils';

const TYPE_COLORS = { data: '#3b82f6', regulatory: '#10b981', deal: '#8b5cf6', conference: '#f97316' };
const TYPE_LABELS = { data: '임상 데이터', regulatory: '허가/승인', deal: '딜/계약', conference: '학회' };
const IMP = {
  high:   { border: '#f59e0b', bg: 'rgba(245,158,11,0.07)', star: '★★★', label: '높음', color: '#f59e0b' },
  medium: { border: '#3b82f6', bg: 'rgba(59,130,246,0.05)', star: '★★☆', label: '중간', color: '#3b82f6' },
  low:    { border: 'rgba(255,255,255,0.08)', bg: 'transparent', star: '★☆☆', label: '낮음', color: '#475569' },
};

/* ─── EventDetail side panel ─── */
function EventDetail({ event, onClose }) {
  const navigate = useNavigate();
  if (!event) return null;
  const typeColor = TYPE_COLORS[event.type] || '#64748b';
  const dday = getDDay(event.date);
  const imp = IMP[event.importance] || IMP.low;

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
      background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 200, padding: 24, overflowY: 'auto',
    }}>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, marginBottom: 16 }}>✕</button>

      {/* D-Day big display */}
      {event.status !== 'completed' && dday !== null && (
        <div style={{
          background: imp.bg, border: `1px solid ${imp.border}44`,
          borderRadius: 10, padding: '14px 16px', marginBottom: 16, textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: dday <= 7 ? '#ef4444' : dday <= 30 ? '#f59e0b' : imp.color, letterSpacing: -1 }}>
            {formatDDay(dday)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{formatDisplayDate(event)}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: typeColor, background: `${typeColor}18`, padding: '3px 8px', borderRadius: 4 }}>
          {TYPE_LABELS[event.type]}
        </span>
        <span style={{ fontSize: 11, color: imp.color, background: imp.bg, border: `1px solid ${imp.border}44`, padding: '3px 8px', borderRadius: 4, fontWeight: 700 }}>
          {imp.star} {imp.label}
        </span>
        {event.status === 'completed' && <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 4 }}>✓ 완료 · {formatDisplayDate(event)}</span>}
        {event.status === 'tentative' && <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: 4 }}>미확정</span>}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.4 }}>{event.event}</h2>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
        {event.company}{event.drug && ` · ${event.drug}`}
      </div>

      {event.whyItMatters && (
        <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700, marginBottom: 6 }}>💡 왜 중요한가</div>
          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{event.whyItMatters}</p>
        </div>
      )}

      {event.impact && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>기대 영향</div>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{event.impact}</p>
        </div>
      )}

      {event.companyId && (
        <button onClick={() => navigate(`/company/${event.companyId}`)} style={{
          width: '100%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
          color: '#3b82f6', borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          {event.company} 상세 →
        </button>
      )}
    </div>
  );
}

/* ─── Single event card ─── */
function EventCard({ ev, selected, onClick }) {
  const [showWhy, setShowWhy] = useState(false);
  const dday = getDDay(ev.date);
  const isPast = ev.status === 'completed' || (dday !== null && dday < 0);
  const typeColor = TYPE_COLORS[ev.type] || '#64748b';
  const imp = IMP[ev.importance] || IMP.low;

  return (
    <div style={{
      background: selected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.025)',
      border: `1px solid ${selected ? 'rgba(59,130,246,0.35)' : imp.border}`,
      borderLeft: `4px solid ${isPast ? '#334155' : imp.border}`,
      borderRadius: 8, overflow: 'hidden',
      opacity: isPast ? 0.6 : 1,
      transition: 'all 0.15s',
    }}>
      {/* Main row */}
      <div
        onClick={onClick}
        style={{ padding: '12px 14px', cursor: 'pointer' }}
        onMouseEnter={e => !selected && (e.currentTarget.parentElement.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={e => !selected && (e.currentTarget.parentElement.style.background = 'rgba(255,255,255,0.025)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          {/* Left: info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: typeColor, background: `${typeColor}18`, padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>
                {TYPE_LABELS[ev.type]}
              </span>
              <span style={{ fontSize: 11, color: imp.color, fontWeight: 700 }}>{imp.star}</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{ev.company}</span>
              {ev.drug && <span style={{ fontSize: 10, color: '#64748b' }}>· {ev.drug}</span>}
              {ev.status === 'completed' && <span style={{ fontSize: 10, color: '#10b981' }}>✓ 완료</span>}
              {ev.status === 'tentative' && <span style={{ fontSize: 10, color: '#f59e0b' }}>미확정</span>}
            </div>
            <div style={{ fontSize: 13, color: isPast ? '#94a3b8' : '#f1f5f9', fontWeight: 500, lineHeight: 1.4 }}>
              {ev.event}
            </div>
          </div>

          {/* Right: D-Day */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#64748b' }}>{formatDisplayDate(ev)}</div>
            {!isPast && dday !== null && (
              <div style={{
                fontSize: 13, fontWeight: 800,
                color: dday <= 7 ? '#ef4444' : dday <= 30 ? '#f59e0b' : dday <= 90 ? '#3b82f6' : '#64748b',
                marginTop: 2,
              }}>
                {formatDDay(dday)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Why it matters (expandable inline) */}
      {ev.whyItMatters && !isPast && (
        <div
          onClick={() => setShowWhy(v => !v)}
          style={{
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '7px 14px',
            cursor: 'pointer',
            background: showWhy ? 'rgba(59,130,246,0.05)' : 'transparent',
          }}
        >
          {!showWhy ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#3b82f6' }}>💡</span>
              <span style={{ fontSize: 11, color: '#475569' }}>왜 중요한가 보기</span>
              <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>▼</span>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>💡 왜 중요한가</span>
                <span style={{ fontSize: 10, color: '#334155', marginLeft: 'auto' }}>▲</span>
              </div>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>{ev.whyItMatters}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Conference card ─── */
function ConferenceCard({ conf }) {
  const navigate = useNavigate();
  const dday = getDDay(conf.date);
  const isPast = dday !== null && dday < 0;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: `1px solid ${isPast ? 'rgba(255,255,255,0.06)' : 'rgba(249,115,22,0.25)'}`,
      borderLeft: `4px solid ${isPast ? '#334155' : '#f97316'}`,
      borderRadius: 10, padding: '14px 16px',
      opacity: isPast ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 800, color: isPast ? '#64748b' : '#f97316' }}>{conf.shortName}</span>
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>{conf.name}</span>
        </div>
        {!isPast && dday !== null ? (
          <span style={{ fontSize: 13, fontWeight: 800, color: dday <= 30 ? '#f59e0b' : '#64748b', flexShrink: 0 }}>
            {formatDDay(dday)}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: '#334155' }}>완료</span>
        )}
      </div>
      <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
        {conf.date}{conf.endDate && conf.endDate !== conf.date ? ` ~ ${conf.endDate}` : ''} · {conf.location}
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: conf.relevantCompanies?.length ? 8 : 0 }}>
        {conf.significance}
      </div>
      {conf.relevantCompanies?.length > 0 && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {conf.relevantCompanies.map(id => {
            const co = companies.find(c => c.id === id);
            return co ? (
              <span key={id} onClick={() => navigate(`/company/${id}`)} style={{
                fontSize: 10, color: '#3b82f6', background: 'rgba(59,130,246,0.1)',
                padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
              }}>{co.name}</span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function CalendarPage() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterImportance, setFilterImportance] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [activeTab, setActiveTab] = useState('timeline');
  const [completedOpen, setCompletedOpen] = useState(false);
  const [pastConfOpen, setPastConfOpen] = useState(false);

  const allEvents = catalysts.events;

  // Split upcoming vs completed
  const upcomingEvents = allEvents
    .filter(ev => ev.status !== 'completed')
    .filter(ev => filterType === 'all' || ev.type === filterType)
    .filter(ev => filterImportance === 'all' || ev.importance === filterImportance)
    .filter(ev => filterCompany === 'all' || ev.companyId === filterCompany)
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999')); // nearest first

  const completedEvents = allEvents
    .filter(ev => ev.status === 'completed')
    .filter(ev => filterType === 'all' || ev.type === filterType)
    .filter(ev => filterImportance === 'all' || ev.importance === filterImportance)
    .filter(ev => filterCompany === 'all' || ev.companyId === filterCompany)
    .sort((a, b) => b.date.localeCompare(a.date)); // most recent first

  const upcomingConfs = conferences.conferences
    .filter(c => { const d = getDDay(c.date); return d === null || d >= 0; })
    .sort((a, b) => a.date.localeCompare(b.date));
  const pastConfs = conferences.conferences
    .filter(c => { const d = getDDay(c.date); return d !== null && d < 0; })
    .sort((a, b) => b.date.localeCompare(a.date));

  const highCount = allEvents.filter(e => e.importance === 'high' && e.status !== 'completed').length;
  const thisMonthCount = allEvents.filter(e => {
    const d = getDDay(e.date);
    return d !== null && d >= 0 && d <= 31 && e.status !== 'completed';
  }).length;

  const uniqueCompanies = [...new Set(allEvents.map(e => e.companyId).filter(Boolean))];

  const handleEventClick = (ev) => {
    setSelectedEvent(prev => prev?.id === ev.id ? null : ev);
  };

  return (
    <div className="animate-fade-in" style={{ paddingRight: selectedEvent ? 420 : 0, transition: 'padding 0.2s' }}>
      <Helmet>
        <title>바이오 촉매 캘린더 | K-Bio Pipeline Tracker</title>
        <meta name="description" content="국내 바이오텍 임상 일정, 학회 발표, 기술이전 이벤트를 한눈에. D-Day 카운트다운." />
      </Helmet>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: -0.5 }}>
          촉매 캘린더
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          다가오는 임상 결과·허가·딜·학회 이벤트 트래킹
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: '다가오는 이벤트', value: upcomingEvents.length, color: '#3b82f6' },
          { label: '이번 달 이내', value: thisMonthCount, color: '#f59e0b' },
          { label: '높음 중요도', value: highCount, color: '#ef4444' },
          { label: '완료', value: completedEvents.length, color: '#10b981' },
        ].map(s => (
          <div key={s.label} style={{
            background: `${s.color}10`, border: `1px solid ${s.color}30`,
            borderRadius: 10, padding: '10px 18px', textAlign: 'center', minWidth: 100,
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {[['timeline', '📅 이벤트 타임라인'], ['conferences', '🏛 주요 학회 일정']].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: activeTab === key ? '#f1f5f9' : '#64748b',
            padding: '10px 16px',
            borderBottom: `2px solid ${activeTab === key ? '#3b82f6' : 'transparent'}`,
            marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* ── TIMELINE TAB ── */}
      {activeTab === 'timeline' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Importance quick-filter pills */}
            <div style={{ display: 'flex', gap: 4 }}>
              {[['all', '전체'], ['high', '★★★ 높음'], ['medium', '★★ 중간'], ['low', '★ 낮음']].map(([v, l]) => (
                <button key={v} onClick={() => setFilterImportance(v)} style={{
                  background: filterImportance === v ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${filterImportance === v ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: filterImportance === v ? '#e2e8f0' : '#64748b',
                  borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontWeight: filterImportance === v ? 700 : 400,
                }}>{l}</button>
              ))}
            </div>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#e2e8f0', fontSize: 12 }}>
              {[['all', '전체 타입'], ['data', '임상 데이터'], ['regulatory', '허가/승인'], ['deal', '딜/계약'], ['conference', '학회']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', color: '#e2e8f0', fontSize: 12 }}>
              <option value="all">전체 기업</option>
              {uniqueCompanies.map(id => {
                const co = companies.find(c => c.id === id);
                return <option key={id} value={id}>{co?.name || id}</option>;
              })}
            </select>
          </div>

          {/* ── Upcoming events ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>다가오는 이벤트</span>
              <span style={{ fontSize: 11, color: '#3b82f6', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 10 }}>
                {upcomingEvents.length}개
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>· D-Day 가까운 순</span>
            </div>

            {upcomingEvents.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: 32 }}>해당하는 이벤트가 없습니다</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.map(ev => (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    selected={selectedEvent?.id === ev.id}
                    onClick={() => handleEventClick(ev)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Completed events (collapsed) ── */}
          <div>
            <button
              onClick={() => setCompletedOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, padding: '10px 14px', cursor: 'pointer', marginBottom: completedOpen ? 12 : 0,
              }}
            >
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                ✓ 완료된 이벤트
              </span>
              <span style={{ fontSize: 11, color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '1px 7px', borderRadius: 8 }}>
                {completedEvents.length}개
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#334155' }}>
                {completedOpen ? '▲ 접기' : '▼ 펼치기'}
              </span>
            </button>

            {completedOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {completedEvents.map(ev => (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    selected={selectedEvent?.id === ev.id}
                    onClick={() => handleEventClick(ev)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── CONFERENCES TAB ── */}
      {activeTab === 'conferences' && (
        <div>
          {/* Upcoming conferences */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>예정된 학회</span>
              <span style={{ fontSize: 11, color: '#f97316', background: 'rgba(249,115,22,0.12)', padding: '2px 8px', borderRadius: 10 }}>
                {upcomingConfs.length}개
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {upcomingConfs.map(conf => <ConferenceCard key={conf.id} conf={conf} />)}
            </div>
          </div>

          {/* Past conferences (collapsed) */}
          {pastConfs.length > 0 && (
            <div>
              <button
                onClick={() => setPastConfOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer', marginBottom: pastConfOpen ? 12 : 0,
                }}
              >
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>✓ 지난 학회</span>
                <span style={{ fontSize: 11, color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '1px 7px', borderRadius: 8 }}>
                  {pastConfs.length}개
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#334155' }}>{pastConfOpen ? '▲ 접기' : '▼ 펼치기'}</span>
              </button>
              {pastConfOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                  {pastConfs.map(conf => <ConferenceCard key={conf.id} conf={conf} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Side Panel */}
      {selectedEvent && <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  );
}
