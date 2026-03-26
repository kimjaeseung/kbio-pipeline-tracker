import companies from '../data/companies.json';

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 14px',
  color: '#e2e8f0',
  fontSize: 13,
};

const selectStyle = {
  background: '#0f172a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: 12,
  cursor: 'pointer',
};

export default function FilterBar({ search, setSearch, filterCat, setFilterCat, sortBy, setSortBy, view, setView }) {
  const categories = ['전체', ...new Set(companies.map(c => c.category))];

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        type="text"
        placeholder="기업명, 종목코드, 약물명, 적응증 검색..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, width: 280 }}
      />
      <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={selectStyle}>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={selectStyle}>
        <option value="tag">🏆 딱지 우선</option>
        <option value="phase">임상단계순</option>
        <option value="pipeline">파이프라인 수</option>
        <option value="name">가나다순</option>
      </select>
      {setView && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {['grid', 'table'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                background: view === v ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                border: '1px solid ' + (view === v ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'),
                color: view === v ? '#3b82f6' : '#64748b',
                borderRadius: 6, padding: '6px 14px', fontSize: 12, cursor: 'pointer',
              }}
            >
              {v === 'grid' ? '카드' : '테이블'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
