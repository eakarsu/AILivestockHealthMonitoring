import React, { useEffect, useState } from 'react';
import api from '../services/api';

const EMPTY = { species: 'Cattle', metric: 'temperature', min_value: '', max_value: '', severity: 'medium', note: '' };

export default function HealthRulesEditor() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const load = (species = '') => {
    setLoading(true);
    setError('');
    const url = species ? `/custom-views/health-rules?species=${encodeURIComponent(species)}` : '/custom-views/health-rules';
    api.get(url)
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Failed to load rules'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  const reset = () => { setForm(EMPTY); setEditingId(null); };

  const submit = async (e) => {
    e?.preventDefault?.();
    setError(''); setStatus('');
    const payload = {
      species: form.species,
      metric: form.metric,
      min_value: parseFloat(form.min_value),
      max_value: parseFloat(form.max_value),
      severity: form.severity,
      note: form.note || '',
    };
    if (Number.isNaN(payload.min_value) || Number.isNaN(payload.max_value)) {
      setError('min_value and max_value must be numbers'); return;
    }
    try {
      if (editingId) {
        await api.put('/custom-views/health-rules', { id: editingId, ...payload });
        setStatus(`Rule #${editingId} updated.`);
      } else {
        const r = await api.post('/custom-views/health-rules', payload);
        setStatus(`Rule #${r.data?.rule?.id} created.`);
      }
      reset();
      load(filter);
    } catch (e) {
      setError(e.response?.data?.error || 'Save failed');
    }
  };

  const edit = (r) => {
    setEditingId(r.id);
    setForm({
      species: r.species, metric: r.metric,
      min_value: r.min_value, max_value: r.max_value,
      severity: r.severity, note: r.note || '',
    });
    setStatus('');
  };

  const del = async (id) => {
    setError(''); setStatus('');
    try {
      await api.delete(`/custom-views/health-rules?id=${id}`);
      setStatus(`Rule #${id} deleted.`);
      load(filter);
    } catch (e) {
      setError(e.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div data-testid="health-rules-editor" style={st.card}>
      <div style={st.header}>
        <div>
          <h3 style={st.title}>Health Monitoring Rules</h3>
          <p style={st.sub}>CRUD vital-sign thresholds per species (drives heatmap status colors)</p>
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={st.input} data-testid="rules-species-filter">
          <option value="">All species</option>
          {(data?.species || []).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <form onSubmit={submit} style={st.form}>
        <select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })} style={st.input}>
          {['Cattle', 'Sheep', 'Goat', 'Swine', 'Poultry', 'Horse', 'Rabbit'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })} style={st.input}>
          {(data?.metrics || ['temperature', 'heart_rate', 'respiratory_rate', 'weight', 'body_condition_score']).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input type="number" step="0.1" placeholder="min" value={form.min_value} onChange={e => setForm({ ...form, min_value: e.target.value })} style={st.input} />
        <input type="number" step="0.1" placeholder="max" value={form.max_value} onChange={e => setForm({ ...form, max_value: e.target.value })} style={st.input} />
        <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })} style={st.input}>
          {(data?.severities || ['low', 'medium', 'high', 'critical']).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={{ ...st.input, gridColumn: '1 / -1' }} />
        <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
          <button type="submit" style={st.btnPrimary} data-testid="save-rule-btn">
            {editingId ? `Update Rule #${editingId}` : 'Add Rule'}
          </button>
          {editingId && <button type="button" onClick={reset} style={st.btnSecondary}>Cancel</button>}
        </div>
      </form>

      {status && <div style={st.ok}>{status}</div>}
      {error && <div style={st.error}>{error}</div>}

      {loading && <div style={st.muted}>Loading…</div>}

      {!loading && data && (
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table style={st.table}>
            <thead>
              <tr>
                <th style={st.th}>ID</th>
                <th style={st.th}>Species</th>
                <th style={st.th}>Metric</th>
                <th style={st.th}>Min</th>
                <th style={st.th}>Max</th>
                <th style={st.th}>Severity</th>
                <th style={st.th}>Note</th>
                <th style={st.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.rules || []).map(r => (
                <tr key={r.id}>
                  <td style={st.td}>{r.id}</td>
                  <td style={st.td}>{r.species}</td>
                  <td style={st.td}>{r.metric}</td>
                  <td style={st.td}>{r.min_value}</td>
                  <td style={st.td}>{r.max_value}</td>
                  <td style={st.td}>
                    <span style={{ ...st.badge, background: r.severity === 'critical' ? '#991b1b' : r.severity === 'high' ? '#dc2626' : r.severity === 'medium' ? '#f97316' : '#fbbf24' }}>
                      {r.severity}
                    </span>
                  </td>
                  <td style={st.td}>{r.note}</td>
                  <td style={st.td}>
                    <button onClick={() => edit(r)} style={st.btnLink}>edit</button>{' '}
                    <button onClick={() => del(r.id)} style={{ ...st.btnLink, color: '#dc2626' }}>delete</button>
                  </td>
                </tr>
              ))}
              {(data.rules || []).length === 0 && (
                <tr><td colSpan={8} style={st.muted}>No rules match this filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const st = {
  card: { background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  title: { margin: 0, fontSize: 16, color: '#0f172a' },
  sub: { margin: '4px 0 0', fontSize: 12, color: '#64748b' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 8 },
  input: { padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'inherit' },
  btnPrimary: { padding: '6px 14px', borderRadius: 6, border: 'none', background: '#4f46e5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSecondary: { padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer' },
  btnLink: { background: 'transparent', border: 'none', color: '#0891b2', cursor: 'pointer', fontSize: 12, padding: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #e2e8f0', color: '#475569', background: '#f8fafc' },
  td: { padding: '6px 8px', borderBottom: '1px solid #f1f5f9' },
  badge: { padding: '2px 8px', borderRadius: 12, color: '#fff', fontSize: 11, fontWeight: 600 },
  ok: { marginTop: 10, color: '#059669', fontSize: 13 },
  error: { marginTop: 10, color: '#dc2626', fontSize: 13 },
  muted: { color: '#94a3b8', padding: '24px 0', textAlign: 'center', fontSize: 13 },
};
