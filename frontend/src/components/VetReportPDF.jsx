import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function VetReportPDF() {
  const [meta, setMeta] = useState(null);
  const [animalId, setAnimalId] = useState('');
  const [reportType, setReportType] = useState('Routine Wellness');
  const [vetName, setVetName] = useState('Dr. Field');
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/custom-views/vet-report-pdf')
      .then(r => {
        setMeta(r.data);
        if (r.data?.animals?.[0]) setAnimalId(String(r.data.animals[0].id));
        if (r.data?.reportTypes?.[0]) setReportType(r.data.reportTypes[0]);
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to load report picker'));
  }, []);

  const generate = async () => {
    if (!animalId) { setError('Please select an animal'); return; }
    setBusy(true); setError(''); setStatus('');
    try {
      const res = await api.post('/custom-views/vet-report-pdf', {
        animal_id: Number(animalId),
        report_type: reportType,
        vet_name: vetName,
        findings,
        recommendations,
      }, { responseType: 'blob' });

      const ct = res.headers['content-type'] || '';
      if (ct.includes('application/pdf')) {
        const blob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const animal = meta?.animals?.find(x => String(x.id) === String(animalId));
        a.href = url;
        a.download = `vet-report-${animal?.tag_id || animalId}.pdf`;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        setStatus('PDF downloaded.');
      } else {
        const text = await res.data.text();
        try {
          const payload = JSON.parse(text);
          setStatus(payload.warning
            ? `${payload.warning}. Report id: ${payload.report?.report_id || ''}`
            : 'Report generated (JSON fallback).');
        } catch {
          setStatus('Report generated.');
        }
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'PDF generation failed');
    } finally { setBusy(false); }
  };

  return (
    <div data-testid="vet-report-pdf" style={st.card}>
      <h3 style={st.title}>Vet Report PDF</h3>
      <p style={st.sub}>Generate a printable veterinary report for a selected animal</p>

      <div style={st.grid}>
        <label style={st.label}>
          Animal
          <select value={animalId} onChange={e => setAnimalId(e.target.value)} style={st.input} data-testid="report-animal-picker">
            {(meta?.animals || []).map(a => (
              <option key={a.id} value={a.id}>{a.tag_id} — {a.name} ({a.species})</option>
            ))}
          </select>
        </label>

        <label style={st.label}>
          Report Type
          <select value={reportType} onChange={e => setReportType(e.target.value)} style={st.input}>
            {(meta?.reportTypes || []).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label style={st.label}>
          Veterinarian
          <input value={vetName} onChange={e => setVetName(e.target.value)} style={st.input} />
        </label>
      </div>

      <label style={st.label}>
        Findings (optional — auto-filled from latest record)
        <textarea value={findings} onChange={e => setFindings(e.target.value)} style={{ ...st.input, minHeight: 60 }} />
      </label>

      <label style={st.label}>
        Recommendations (optional)
        <textarea value={recommendations} onChange={e => setRecommendations(e.target.value)} style={{ ...st.input, minHeight: 60 }} />
      </label>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
        <button onClick={generate} disabled={busy} style={st.btn} data-testid="generate-report-btn">
          {busy ? 'Generating…' : 'Generate Report'}
        </button>
        {meta && (
          <span style={st.muted}>
            Clinic: <strong>{meta.vetClinic}</strong> · PDF engine: <strong>{meta.pdfReady ? 'pdfkit' : 'JSON fallback'}</strong>
          </span>
        )}
      </div>
      {status && <div style={st.ok}>{status}</div>}
      {error && <div style={st.error}>{error}</div>}
    </div>
  );
}

const st = {
  card: { background: '#fff', borderRadius: 10, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
  title: { margin: 0, fontSize: 16, color: '#0f172a' },
  sub: { margin: '4px 0 12px', fontSize: 12, color: '#64748b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 10 },
  label: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#475569', marginBottom: 10 },
  input: { padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'inherit' },
  btn: { padding: '8px 16px', borderRadius: 6, border: 'none', background: '#0891b2', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  ok: { marginTop: 10, color: '#059669', fontSize: 13 },
  error: { marginTop: 10, color: '#dc2626', fontSize: 13 },
  muted: { color: '#94a3b8', fontSize: 12 },
};
