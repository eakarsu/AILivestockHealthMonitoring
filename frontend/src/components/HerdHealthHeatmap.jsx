import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function HerdHealthHeatmap() {
  const [data, setData] = useState(null);
  const [herdId, setHerdId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const url = herdId
      ? `/custom-views/herd-health-heatmap?herd_id=${herdId}`
      : '/custom-views/herd-health-heatmap';
    api.get(url)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load heatmap'))
      .finally(() => setLoading(false));
  }, [herdId]);

  return (
    <div data-testid="herd-health-heatmap" style={st.card}>
      <div style={st.header}>
        <div>
          <h3 style={st.title}>Herd Health Heatmap</h3>
          <p style={st.sub}>Most-recent vitals per animal, colored by species-rule status</p>
        </div>
        <select
          value={herdId}
          onChange={e => setHerdId(e.target.value)}
          style={st.select}
          data-testid="heatmap-herd-picker"
        >
          <option value="">All Herds</option>
          {(data?.herds || []).map(h => (
            <option key={h.id} value={h.id}>{h.name} ({h.herd_type})</option>
          ))}
        </select>
      </div>

      {loading && <div style={st.muted}>Loading…</div>}
      {error && <div style={st.error}>{error}</div>}

      {!loading && !error && data && (
        <>
          {data.legend && (
            <div style={st.legendBar}>
              {data.legend.map(l => (
                <span key={l.status} style={st.legendItem}>
                  <span style={{ ...st.legendDot, background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          )}

          {data.matrix && data.matrix.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={st.table}>
                <thead>
                  <tr>
                    <th style={st.th}>Animal</th>
                    <th style={st.th}>Species</th>
                    {(data.metrics || []).map(m => (
                      <th key={m} style={st.th}>{m.replace(/_/g, ' ')}</th>
                    ))}
                    <th style={st.th}>Last Record</th>
                  </tr>
                </thead>
                <tbody>
                  {data.matrix.map(row => (
                    <tr key={row.animal_id}>
                      <td style={st.td}><strong>{row.tag_id}</strong><br /><span style={{ color: '#64748b', fontSize: 11 }}>{row.name}</span></td>
                      <td style={st.td}>{row.species}</td>
                      {(data.metrics || []).map(m => {
                        const cell = row.cells[m] || { value: null, color: '#94a3b8', status: 'unknown' };
                        return (
                          <td key={m} style={{ ...st.cell, background: cell.color, color: '#fff' }} title={`${m}: ${cell.status}`}>
                            {cell.value != null ? cell.value : '—'}
                          </td>
                        );
                      })}
                      <td style={st.td}>{row.record_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={st.muted}>No animals found.</div>
          )}
        </>
      )}
    </div>
  );
}

const st = {
  card: { background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  title: { margin: 0, fontSize: 16, color: '#0f172a' },
  sub: { margin: '4px 0 0', fontSize: 12, color: '#64748b' },
  select: { padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 220 },
  muted: { color: '#94a3b8', padding: '24px 0', textAlign: 'center', fontSize: 13 },
  error: { color: '#dc2626', padding: '8px 0', fontSize: 13 },
  legendBar: { display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569' },
  legendDot: { width: 12, height: 12, borderRadius: 3, display: 'inline-block' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc', whiteSpace: 'nowrap' },
  td: { padding: '6px 8px', borderBottom: '1px solid #f1f5f9' },
  cell: { padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontWeight: 600, minWidth: 60 },
};
