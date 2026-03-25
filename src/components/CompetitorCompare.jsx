import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AE_KEYWORDS = ['ae', 'tox', 'adverse', 'grade'];

function isAdverseEndpoint(key) {
  const k = key.toLowerCase();
  return AE_KEYWORDS.some(kw => k.includes(kw));
}

function MetricChart({ metricKey, mainDrug, competitors }) {
  const allDrugs = [mainDrug, ...competitors];
  const data = allDrugs
    .map(d => ({
      name: d.name || d.drug,
      value: d.endpoints?.[metricKey]?.value ?? null,
      unit: d.endpoints?.[metricKey]?.unit ?? '%',
      isMain: d === mainDrug,
    }))
    .filter(d => d.value !== null);

  if (data.length === 0) return null;

  const isAE = isAdverseEndpoint(metricKey);
  const label = mainDrug.endpoints?.[metricKey]?.description || metricKey;

  const maxVal = Math.max(...data.map(d => d.value));
  const chartMax = Math.ceil(maxVal * 1.25);

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
        {label} {isAE ? <span style={{ color: '#64748b', fontSize: 11 }}>(낮을수록 좋음 ↓)</span> : '(%)'}
      </div>
      <ResponsiveContainer width="100%" height={data.length * 44 + 20}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 40, top: 0, bottom: 0 }}>
          <XAxis type="number" domain={[0, chartMax]} hide />
          <YAxis type="category" dataKey="name" width={160} tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip
            formatter={(v, n, props) => [`${v}${props.payload.unit}`, label]}
            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#f1f5f9' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#94a3b8', fontSize: 12, formatter: (v) => `${v}%` }}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.isMain
                    ? (isAE ? (entry.value === Math.min(...data.map(d => d.value)) ? '#10b981' : '#3b82f6') : '#3b82f6')
                    : 'rgba(255,255,255,0.12)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function CompetitorCompare({ mainDrug, competitors, endpointsToCompare }) {
  if (!competitors || competitors.length === 0) return null;

  const allEndpoints = endpointsToCompare || Object.keys(mainDrug.endpoints || {});
  const allDrugs = [mainDrug, ...competitors];

  return (
    <div>
      {/* Charts */}
      {allEndpoints.map(key => (
        <MetricChart key={key} metricKey={key} mainDrug={mainDrug} competitors={competitors} />
      ))}

      {/* Comparison Table */}
      <div style={{ overflowX: 'auto', marginTop: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['항목', ...allDrugs.map(d => d.name || d.drug)].map((h, i) => (
                <th key={i} style={{
                  textAlign: 'left', padding: '8px 10px', color: '#64748b', fontWeight: 500, fontSize: 11,
                  color: i > 0 && allDrugs[i - 1] === mainDrug ? '#3b82f6' : '#64748b',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>개발사</td>
              {allDrugs.map((d, i) => (
                <td key={i} style={{ padding: '8px 10px', color: i === 0 ? '#f1f5f9' : '#94a3b8' }}>
                  {d.company}
                </td>
              ))}
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>임상단계</td>
              {allDrugs.map((d, i) => (
                <td key={i} style={{ padding: '8px 10px', color: i === 0 ? '#f1f5f9' : '#94a3b8' }}>
                  {d.phase || '-'}
                </td>
              ))}
            </tr>
            {allEndpoints.map(key => {
              const values = allDrugs.map(d => d.endpoints?.[key]?.value ?? null);
              const validValues = values.filter(v => v !== null);
              const isAE = isAdverseEndpoint(key);
              const bestVal = isAE ? Math.min(...validValues) : Math.max(...validValues);
              const label = mainDrug.endpoints?.[key]?.description || key;
              return (
                <tr key={key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>{label}</td>
                  {allDrugs.map((d, i) => {
                    const val = d.endpoints?.[key]?.value ?? null;
                    const unit = d.endpoints?.[key]?.unit ?? '%';
                    const isBest = val !== null && val === bestVal;
                    return (
                      <td key={i} style={{
                        padding: '8px 10px',
                        color: isBest ? '#10b981' : (val !== null ? '#cbd5e1' : '#475569'),
                        fontWeight: isBest ? 700 : 400,
                      }}>
                        {val !== null ? `${val}${unit}` : '-'}
                        {isBest && <span style={{ fontSize: 9, marginLeft: 3 }}>★</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>장점</td>
              <td style={{ padding: '8px 10px', color: '#94a3b8', fontSize: 11 }}>-</td>
              {competitors.map((d, i) => (
                <td key={i} style={{ padding: '8px 10px', color: '#94a3b8', fontSize: 11 }}>{d.advantage || '-'}</td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>단점</td>
              <td style={{ padding: '8px 10px', color: '#94a3b8', fontSize: 11 }}>-</td>
              {competitors.map((d, i) => (
                <td key={i} style={{ padding: '8px 10px', color: '#94a3b8', fontSize: 11 }}>{d.disadvantage || '-'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
