import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import catalysts from '../data/catalysts.json';
import conferences from '../data/conferences.json';
import companies from '../data/companies.json';
import { getDDay, formatDDay, formatDisplayDate, groupByMonth } from '../utils/dateUtils';

const TYPE_COLORS = { data: '#3b82f6', regulatory: '#10b981', deal: '#8b5cf6', conference: '#f97316' };
const TYPE_LABELS = { data: '데이터', regulatory: '허가/승인', deal: '딜/계약', conference: '학회' };
const IMPORTANCE_BORDER = { high: '#f59e0b', medium: '#3b82f6', low: 'rgba(255,255,255,0.1)' };

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

function EventDetail({ event, onClose }) {
  const navigate = useNavigate();
  if (!event) return null;
  const typeColor = TYPE_COLORS[event.type] || '#64748b';
  const dday = getDDay(event.date);
  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
      background: '#0f172a', borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 200, padding: 24, overflowY: 'auto', animation: 'fadeIn 0.2s ease',
    }}>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20, marginBottom: 16 }}>✕</button>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: typeColor, background: `${typeColor}18`, padding: '3px 8px', borderRadius: 4 }}>
          {TYPE_LABELS[event.type]}
        </span>
        <span style={{ fontSize: 11, color: event.importance === 'high' ? '#f59e0b' : event.importance === 'medium' ? '#3b82f6' : '#64748b', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 4 }}>
          {event.importance === 'high' ? '중요도 높음' : event.importance === 'medium' ? '중요도 중간' : '중요도 낮음'}
        </span>
        {event.status === 'completed' && <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 4 }}>완료</span>}
        {event.status === 'tentative' && <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '3px 8px', borderRadius: 4 }}>미확정</span>}
      </div>

      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 8, lineHeight: 1.4 }}>{event.event}</h2>

      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
        {event.company} {event.drug && `· ${event.drug}`}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
        {formatDisplayDate(event)}
        {dday !== null && event.status !== 'completed' && (
          <span style={{ marginLeft: 8, color: dday <= 30 ? '#f59e0b' : '#64748b', fontWeight: 700 }}>
            ({formatDDay(dday)})
          </span>
        )}
      </div>

      {event.impact && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>기대 영향</div>
          <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, margin: 0 }}>{event.impact}</p>
        </div>
      )}

      {event.whyItMatters && (
        <div style={{
          background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 8, padding: '12px 14px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, marginBottom: 4 }}>왜 중요한가</div>
          <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{event.whyItMatters}</p>
        </div>
      )}

      {event.companyId && (
        <button
          onClick={() => navigate(`/company/${event.companyId}`)}
          style={{
            width: '100%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#3b82f6', borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          {event.company} 상세 →
        </button>
      )}
    </div>
  );
}

function ConferenceCard({ conf }) {
  const navigate = useNavigate();
  const dday = getDDay(conf.date);
  const isPast = dday !== null && dday < 0;
  const typeColor = '#f97316';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${isPast ? 'rgba(255,255,255,0.06)' : 'rgba(249,115,22,0.25)'}`,
      borderRadius: 10, padding: '14px 16px',
      opacity: isPast ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#f97316' }}>{conf.shortName}</span>
          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>{conf.name}</span>
        </div>
        {!isPast && dday !== null && (
          <span style={{ fontSize: 12, fontWeight: 700, color: dday <= 30 ? '#f59e0b' : '#64748b' }}>
            {formatDDay(dday)}
          </span>
        )}
        {isPast && <span style={{ fontSize: 11, color: '#475569' }}>완료</span>}
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
        {conf.date} ~ {conf.endDate !== conf.date ? conf.endDate : ''} · {conf.location}
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5, marginBottom: 8 }}>{conf.significance}</div>
      {conf.relevantCompanies?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {conf.relevantCompanies.map(id => {
            const co = companies.find(c => c.id === id);
            return co ? (
              <span
                key={id}
                onClick={() => navigate(`/company/${id}`)}
                style={{
                  fontSize: 10, color: '#3b82f6', background: 'rgba(59,130,246,0.1)',
                  padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                }}
              >{co.name}</span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterImportance, setFilterImportance] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'conferences'

  const allEvents = catalysts.events;

  const filteredEvents = allEvents.filter(ev => {
    if (filterType !== 'all' && ev.type !== filterType) return false;
    if (filterImportance !== 'all' && ev.importance !== filterImportance) return false;
    if (filterCompany !== 'all' && ev.companyId !== filterCompany) return false;
    return true;
  }).sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));

  const grouped = groupByMonth(filteredEvents);
  const months = Object.keys(grouped).sort();

  const uniqueCompanies = [...new Set(allEvents.map(e => e.companyId).filter(Boolean))];

  return (
    <div className="animate-fade-in" style={{ paddingRight: selectedEvent ? 400 : 0, transition: 'padding 0.2s' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginBottom: 16 }}>
          ← 홈으로
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: '0 0 4px', letterSpacing: -0.5 }}>
          촉매 캘린더
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
          {allEvents.filter(e => e.status === 'upcoming' || e.status === 'tentative').length}개 예정 이벤트 ·{' '}
          {allEvents.filter(e => e.status === 'completed').length}개 완료 이벤트
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
        {[['timeline', '이벤트 타임라인'], ['conferences', '주요 학회 일정']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              color: activeTab === key ? '#f1f5f9' : '#64748b',
              padding: '10px 16px',
              borderBottom: `2px solid ${activeTab === key ? '#3b82f6' : 'transparent'}`,
              marginBottom: -1,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { state: filterType, set: setFilterType, options: [['all', '전체 타입'], ['data', '데이터'], ['regulatory', '허가'], ['deal', '딜'], ['conference', '학회']] },
              { state: filterImportance, set: setFilterImportance, options: [['all', '전체 중요도'], ['high', '높음'], ['medium', '중간'], ['low', '낮음']] },
            ].map((f, i) => (
              <select key={i} value={f.state} onChange={e => f.set(e.target.value)} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px', color: '#e2e8f0', fontSize: 12, cursor: 'pointer' }}>
                {f.options.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            ))}
            <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px', color: '#e2e8f0', fontSize: 12, cursor: 'pointer' }}>
              <option value="all">전체 기업</option>
              {uniqueCompanies.map(id => {
                const co = companies.find(c => c.id === id);
                return <option key={id} value={id}>{co?.name || id}</option>;
              })}
            </select>
          </div>

          {/* Month Timeline */}
          {months.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>해당하는 이벤트가 없습니다</div>
          ) : (
            months.map(monthKey => {
              const [year, month] = monthKey.split('-');
              const events = grouped[monthKey];
              const hasUpcoming = events.some(e => e.status === 'upcoming' || e.status === 'tentative');

              return (
                <div key={monthKey} style={{ marginBottom: 28 }}>
                  {/* Month header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: hasUpcoming ? '#f1f5f9' : '#475569', whiteSpace: 'nowrap' }}>
                      {year}년 {parseInt(month)}월
                    </div>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['data', 'regulatory', 'deal', 'conference'].map(type => {
                        const count = events.filter(e => e.type === type).length;
                        if (!count) return null;
                        return (
                          <span key={type} style={{ width: 8, height: 8, borderRadius: '50%', background: TYPE_COLORS[type], display: 'inline-block' }} title={TYPE_LABELS[type]} />
                        );
                      })}
                    </div>
                  </div>

                  {/* Events */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {events.map(ev => {
                      const isPast = ev.status === 'completed' || (getDDay(ev.date) !== null && getDDay(ev.date) < 0);
                      const dday = getDDay(ev.date);
                      const typeColor = TYPE_COLORS[ev.type] || '#64748b';
                      const borderColor = isPast ? 'rgba(255,255,255,0.06)' : IMPORTANCE_BORDER[ev.importance];

                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev.id === selectedEvent?.id ? null : ev)}
                          style={{
                            background: selectedEvent?.id === ev.id ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${selectedEvent?.id === ev.id ? 'rgba(59,130,246,0.3)' : borderColor}`,
                            borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                            opacity: isPast ? 0.65 : 1, transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (selectedEvent?.id !== ev.id) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                          onMouseLeave={e => { if (selectedEvent?.id !== ev.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 10, color: typeColor, background: `${typeColor}18`, padding: '1px 6px', borderRadius: 3 }}>
                                  {TYPE_LABELS[ev.type]}
                                </span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>{ev.company}</span>
                                {ev.drug && <span style={{ fontSize: 11, color: '#64748b' }}>· {ev.drug}</span>}
                                {ev.status === 'completed' && <span style={{ fontSize: 10, color: '#10b981' }}>✓ 완료</span>}
                                {ev.status === 'tentative' && <span style={{ fontSize: 10, color: '#f59e0b' }}>미확정</span>}
                              </div>
                              <div style={{ fontSize: 13, color: isPast ? '#94a3b8' : '#f1f5f9', fontWeight: 500, lineHeight: 1.4 }}>
                                {ev.event}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{formatDisplayDate(ev)}</div>
                              {!isPast && dday !== null && (
                                <div style={{ fontSize: 12, fontWeight: 700, color: dday <= 7 ? '#ef4444' : dday <= 30 ? '#f59e0b' : '#64748b' }}>
                                  {formatDDay(dday)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {activeTab === 'conferences' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {conferences.conferences
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(conf => <ConferenceCard key={conf.id} conf={conf} />)
            }
          </div>
        </div>
      )}

      {/* Side Panel */}
      {selectedEvent && <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      {/* Overlay for mobile */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199, display: 'none' }}
        />
      )}
    </div>
  );
}
