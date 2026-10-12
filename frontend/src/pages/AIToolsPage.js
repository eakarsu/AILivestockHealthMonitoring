import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AIReport from '../components/AIReport';
import api from '../services/api';


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

const EXAMPLES = {
  'disease-risk-assessment': [
    { context: 'Review vaccination coverage, recent respiratory signs, and animal movements. Separate confirmed observations from suspected risks.' },
    { context: 'Assess a herd after a new arrival. Check quarantine records, contact groups, and missing clinical evidence.' },
    { context: 'Review seasonal disease risk using current herd and vaccination records; recommend veterinary follow-up.' },
  ],
  'breeding-advisor': [
    { goal: 'Improve fertility while considering health history and welfare.' },
    { goal: 'Review pairing options and identify missing genetic or breeding history.' },
    { goal: 'Plan next breeding season with calving risk and veterinary review in mind.' },
  ],
  'health-anomaly-detector': [
    { lookbackDays: 7 }, { lookbackDays: 14 }, { lookbackDays: 30 },
  ],
  'nutrition-optimizer': [
    { targetGoal: 'Support stable milk yield while monitoring body condition and feed intake.' },
    { targetGoal: 'Improve weight gain using verified feed records and available forage.' },
    { targetGoal: 'Maintain condition during a ration transition; flag missing nutrient analysis.' },
  ],
  'economic-forecaster': [
    { horizonMonths: 6, marketContext: 'Compare feed cost and milk revenue scenarios using recorded farm transactions.' },
    { horizonMonths: 12, marketContext: 'Review seasonal veterinary and feed costs; state assumptions for missing prices.' },
    { horizonMonths: 18, marketContext: 'Estimate margin sensitivity to feed prices and herd output; distinguish projections from records.' },
  ],
};

export default function AIToolsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [active, setActive] = useState(TOOLS[0].key);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [records, setRecords] = useState({ animals: [], herds: [] });
  const [recordError, setRecordError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.allSettled([api.get('/animals', { params: { limit: 100 } }), api.get('/herds')])
      .then(([animals, herds]) => {
        if (!active) return;
        const animalPayload = animals.status === 'fulfilled' ? animals.value.data : null;
        const herdPayload = herds.status === 'fulfilled' ? herds.value.data : null;
        setRecords({
          animals: Array.isArray(animalPayload) ? animalPayload : Array.isArray(animalPayload?.data) ? animalPayload.data : [],
          herds: Array.isArray(herdPayload) ? herdPayload : Array.isArray(herdPayload?.data) ? herdPayload.data : [],
        });
        if (animals.status !== 'fulfilled' || herds.status !== 'fulfilled') setRecordError('Some record options could not be loaded. Select an existing animal or herd before running a record-based tool.');
      });
    return () => { active = false; };
  }, []);

  const tool = TOOLS.find(t => t.key === active);
  const applyExample = (index) => {
    const example = EXAMPLES[tool.key][index];
    const next = { ...inputs, ...example };
    for (const field of tool.fields) {
      const collection = field.key === 'animalId' ? records.animals : field.key === 'herdId' ? records.herds : null;
      if (collection && !next[field.key] && collection.length) next[field.key] = String(collection[index % collection.length].id);
    }
    setInputs(next); setResult(null); setError(null);
  };
  const missingRequired = tool.fields.some(field => field.required && !inputs[field.key]);
  const missingReferences = tool.fields.filter(field => (field.key === 'animalId' || field.key === 'herdId') && !inputs[field.key] && !(field.key === 'animalId' ? records.animals : records.herds).length);

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
          <div className="ai-preset-bar"><strong>Fill example</strong><div className="ai-actions">{['Herd review', 'Record review', 'Planning review'].map((label, index) => <button type="button" className="btn btn-secondary" key={label} onClick={() => applyExample(index)}>{label}</button>)}</div></div>
          {recordError && <p role="status">{recordError}</p>}
          {missingRequired && <p role="status">Select an existing animal record to run this tool.</p>}
          {!!missingReferences.length && <p role="status">No existing {missingReferences.map(field => field.key === 'animalId' ? 'animal' : 'herd').join(' or ')} record is available for this example. Choose a genuine record when available.</p>}

          {tool.fields.map(field => (
            <div key={field.key} style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>
                {field.label}{field.required ? ' *' : ''}
              </label>
              {(field.key === 'animalId' || field.key === 'herdId') ? (
                <select value={inputs[field.key] || ''} onChange={e => setInputs(prev => ({ ...prev, [field.key]: e.target.value }))} style={{ width: '100%', padding: '8px' }}>
                  <option value="">Select existing {field.key === 'animalId' ? 'animal' : 'herd'}…</option>
                  {(field.key === 'animalId' ? records.animals : records.herds).map(record => <option key={record.id} value={record.id}>{record.name || record.tag_id || 'Record'}{record.tag_id ? ` (${record.tag_id})` : ''}</option>)}
                </select>
              ) : field.type === 'textarea' ? (
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

          <button onClick={submit} disabled={loading || missingRequired}
            style={{ width: '100%', marginTop: '12px', padding: '12px', fontSize: '15px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Running…' : 'Run AI Tool'}
          </button>

          {error && (
            <div style={{ marginTop: '16px', padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '6px' }}>
              {String(error)}
            </div>
          )}

          {result && <AIReport response={result} title={tool.label} />}
        </div>
      </main>
    </div>
  );
}
