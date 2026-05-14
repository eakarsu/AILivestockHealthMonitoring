import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const TOOLS = [
  {
    key: 'disease-risk-assessment',
    label: 'Disease Risk Assessment',
    icon: '🦠',
    endpoint: '/ai/disease-risk-assessment',
    description: 'Herd-level outbreak risk using Animal + Vaccination context.',
    fields: [
      { key: 'herdId', label: 'Herd ID', type: 'text' },
      { key: 'context', label: 'Context / Notes', type: 'textarea' },
    ],
  },
  {
    key: 'breeding-advisor',
    label: 'Breeding Advisor',
    icon: '🧬',
    endpoint: '/ai/breeding-advisor',
    description: 'Pairing recommendations using Animal + BreedingRecord history.',
    fields: [
      { key: 'animalId', label: 'Animal ID', type: 'text', required: true },
      { key: 'goal', label: 'Breeding Goal', type: 'textarea' },
    ],
  },
  {
    key: 'health-anomaly-detector',
    label: 'Health Anomaly Detector',
    icon: '⚠️',
    endpoint: '/ai/health-anomaly-detector',
    description: 'Flag unusual vital sign / behavior patterns from HealthRecord.',
    fields: [
      { key: 'animalId', label: 'Animal ID', type: 'text' },
      { key: 'lookbackDays', label: 'Lookback (days)', type: 'number', placeholder: '14' },
    ],
  },
  {
    key: 'nutrition-optimizer',
    label: 'Nutrition Optimizer',
    icon: '🌾',
    endpoint: '/ai/nutrition-optimizer',
    description: 'Optimize feed plans for a herd using FeedManagement records.',
    fields: [
      { key: 'herdId', label: 'Herd ID', type: 'text' },
      { key: 'animalId', label: 'Animal ID (optional)', type: 'text' },
      { key: 'targetGoal', label: 'Target Goal', type: 'textarea', placeholder: 'e.g. milk yield, weight gain, maintenance' },
    ],
  },
  {
    key: 'economic-forecaster',
    label: 'Economic Forecaster',
    icon: '📈',
    endpoint: '/ai/economic-forecaster',
    description: 'Forecast farm revenue, costs and margins using FinancialRecord.',
    fields: [
      { key: 'horizonMonths', label: 'Horizon (months)', type: 'number', placeholder: '12' },
      { key: 'marketContext', label: 'Market Context (notes)', type: 'textarea' },
    ],
  },
];

export default function AIToolsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(TOOLS[0].key);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const tool = TOOLS.find(t => t.key === active);

  const submit = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const payload = {};
      tool.fields.forEach(f => {
        const v = inputs[f.key];
        if (v === undefined || v === '') return;
        payload[f.key] = f.type === 'number' ? Number(v) : v;
      });
      const res = await api.post(tool.endpoint, payload);
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-title">AI Tools</h1>
        </div>
        <div className="top-bar-right">
          <button className="btn-logout" onClick={() => navigate('/')} style={{ marginRight: '8px' }}>Back</button>
          <span className="user-name">Welcome, {user?.name}</span>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {TOOLS.map(t => (
            <div
              key={t.key}
              onClick={() => { setActive(t.key); setInputs({}); setResult(null); setError(null); }}
              style={{
                padding: '16px',
                background: active === t.key ? '#7C3AED' : '#fff',
                color: active === t.key ? '#fff' : 'inherit',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontSize: '28px' }}>{t.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '4px' }}>{t.label}</div>
              <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.85 }}>{t.description}</div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: '720px', background: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <h2 style={{ marginTop: 0 }}>{tool.icon} {tool.label}</h2>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>{tool.description}</p>

          {tool.fields.map(field => (
            <div key={field.key} style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>
                {field.label}{field.required ? ' *' : ''}
              </label>
              {field.type === 'textarea' ? (
                <textarea rows={4} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  value={inputs[field.key] || ''}
                  onChange={e => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder || ''} />
              ) : (
                <input type={field.type || 'text'} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  value={inputs[field.key] || ''}
                  onChange={e => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder || ''} />
              )}
            </div>
          ))}

          <button onClick={submit} disabled={loading}
            style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '15px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Running…' : 'Run AI Tool'}
          </button>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '6px' }}>
              {String(error)}
            </div>
          )}

          {result && (
            <div style={{ marginTop: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ marginTop: 0 }}>Result</h3>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontSize: '13px' }}>
                {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
