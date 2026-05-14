import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import api from '../services/api';

const URGENCY_LABELS = { 4: 'Critical', 3: 'High', 2: 'Medium', 1: 'Low', 0: 'Unknown' };
const URGENCY_COLORS = { 4: '#DC2626', 3: '#EA580C', 2: '#D97706', 1: '#059669', 0: '#94A3B8' };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    return (
      <div style={{
        backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px',
        padding: '10px 14px', fontSize: '13px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
      }}>
        <div style={{ color: '#64748B', marginBottom: '4px' }}>{label ? new Date(label).toLocaleDateString() : ''}</div>
        <div style={{ fontWeight: '600', color: URGENCY_COLORS[score] || '#64748B' }}>
          {URGENCY_LABELS[score] || 'Unknown'}
        </div>
        {payload[0].payload?.analysis_type && (
          <div style={{ color: '#94A3B8', marginTop: '2px', fontSize: '12px' }}>
            {payload[0].payload.analysis_type.replace(/_/g, ' ')}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const HealthTrendChart = ({ animalId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!animalId) return;
    setLoading(true);
    api.get(`/animals/${animalId}/health-trend`)
      .then(res => {
        setData(res.data || []);
        setError('');
      })
      .catch(err => {
        setError('Failed to load health trend');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [animalId]);

  if (loading) return <div style={st.loading}>Loading health trend...</div>;
  if (error) return <div style={st.error}>{error}</div>;
  if (!data.length) return (
    <div style={st.empty}>No AI analysis history available for this animal.</div>
  );

  const chartData = data.map(d => ({
    date: d.date ? d.date.substring(0, 10) : '',
    urgency_score: d.urgency_score || 0,
    urgency_level: d.urgency_level,
    analysis_type: d.analysis_type,
  }));

  return (
    <div style={st.container}>
      <div style={st.title}>AI Health Urgency Trend</div>
      <div style={st.legend}>
        {Object.entries(URGENCY_LABELS).reverse().filter(([k]) => k > 0).map(([score, label]) => (
          <div key={score} style={st.legendItem}>
            <div style={{ ...st.legendDot, backgroundColor: URGENCY_COLORS[score] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            tickFormatter={v => v ? v.substring(5) : ''}
          />
          <YAxis
            domain={[0, 4]}
            ticks={[1, 2, 3, 4]}
            tickFormatter={v => URGENCY_LABELS[v]?.[0] || ''}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={3} stroke="#EA580C" strokeDasharray="4 2" strokeOpacity={0.4} />
          <ReferenceLine y={4} stroke="#DC2626" strokeDasharray="4 2" strokeOpacity={0.4} />
          <Line
            type="monotone"
            dataKey="urgency_score"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const st = {
  container: { marginTop: '16px' },
  title: { fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px' },
  legend: { display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%' },
  loading: { color: '#94A3B8', fontSize: '14px', padding: '20px 0', textAlign: 'center' },
  error: { color: '#DC2626', fontSize: '13px', padding: '8px 0' },
  empty: { color: '#94A3B8', fontSize: '13px', padding: '20px 0', textAlign: 'center', fontStyle: 'italic' },
};

export default HealthTrendChart;
