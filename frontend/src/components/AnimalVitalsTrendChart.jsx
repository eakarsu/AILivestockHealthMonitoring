import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../services/api';

export default function AnimalVitalsTrendChart() {
  const [data, setData] = useState(null);
  const [animalId, setAnimalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const url = animalId
      ? `/custom-views/animal-vitals-trend?animal_id=${animalId}`
      : '/custom-views/animal-vitals-trend';
    api.get(url)
      .then(r => {
        setData(r.data);
        if (!animalId && r.data?.active?.id) setAnimalId(String(r.data.active.id));
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load vitals trend'))
      .finally(() => setLoading(false));
  }, [animalId]);

  return (
    <div data-testid="animal-vitals-trend" style={st.card}>
      <div style={st.header}>
        <div>
          <h3 style={st.title}>Animal Vitals Trend</h3>
          <p style={st.sub}>Temperature, heart rate, respiratory rate, and weight over time</p>
        </div>
        <select
          value={animalId}
          onChange={e => setAnimalId(e.target.value)}
          style={st.select}
          data-testid="vitals-animal-picker"
        >
          {(data?.animals || []).map(a => (
            <option key={a.id} value={a.id}>{a.tag_id} — {a.name} ({a.species})</option>
          ))}
        </select>
      </div>

      {loading && <div style={st.muted}>Loading…</div>}
      {error && <div style={st.error}>{error}</div>}

      {!loading && !error && data && (
        <>
          <div style={st.meta}>
            Animal: <strong>{data.active?.name}</strong> · Species: <strong>{data.active?.species}</strong> · Points: <strong>{data.points}</strong>
          </div>
          {data.series && data.series.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.series} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="temperature" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="Temp (°C)" />
                <Line type="monotone" dataKey="heart_rate" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="HR (bpm)" />
                <Line type="monotone" dataKey="respiratory_rate" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} name="RR" />
                <Line type="monotone" dataKey="weight" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={st.muted}>No vitals recorded for this animal.</div>
          )}

          {data.thresholds && data.thresholds.length > 0 && (
            <div style={st.thresholds}>
              <strong style={{ fontSize: 12, color: '#475569' }}>Species thresholds:</strong>
              {data.thresholds.map(t => (
                <span key={t.id} style={st.thresholdBadge}>
                  {t.metric}: {t.min_value}–{t.max_value}
                </span>
              ))}
            </div>
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
  meta: { fontSize: 12, color: '#475569', marginBottom: 8 },
  muted: { color: '#94a3b8', padding: '24px 0', textAlign: 'center', fontSize: 13 },
  error: { color: '#dc2626', padding: '8px 0', fontSize: 13 },
  thresholds: { marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  thresholdBadge: { padding: '2px 8px', borderRadius: 12, background: '#f1f5f9', color: '#475569', fontSize: 11 },
};
