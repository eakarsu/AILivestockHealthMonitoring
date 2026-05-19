// Custom Livestock Views — 4 endpoints supporting:
//  - VIZ1 AnimalVitalsTrendChart  (vitals over time per animal: temp/HR/RR/weight)
//  - VIZ2 HerdHealthHeatmap        (animal x metric matrix, latest values + status color)
//  - NV1  VetReportPDF             (animal picker -> printable vet health report PDF)
//  - NV2  HealthRulesEditor        (CRUD thresholds per species — in-memory)
//
// All endpoints require the existing auth middleware. Mounted at
// /api/custom-views in server.js BEFORE the BATCH 05 mounts (the 404 boundary).

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { sequelize, Animal, HealthRecord, VetVisit, Herd } = require('../models');

let PDFDocument = null;
try { PDFDocument = require('pdfkit'); } catch (e) { PDFDocument = null; }

// ---------------------------------------------------------------------------
// Default health thresholds per species (overridable via rules editor below).
// Stored in-memory; survives within a single backend process.
// ---------------------------------------------------------------------------
const DEFAULT_RULES = [
  { id: 1, species: 'Cattle',  metric: 'temperature',      min_value: 37.5, max_value: 39.5, severity: 'high',   note: 'Normal bovine core temp range' },
  { id: 2, species: 'Cattle',  metric: 'heart_rate',       min_value: 48,   max_value: 84,   severity: 'medium', note: 'Adult resting BPM' },
  { id: 3, species: 'Cattle',  metric: 'respiratory_rate', min_value: 18,   max_value: 30,   severity: 'medium', note: 'Adult breaths/min' },
  { id: 4, species: 'Sheep',   metric: 'temperature',      min_value: 38.5, max_value: 40.0, severity: 'high',   note: 'Ovine normothermia' },
  { id: 5, species: 'Sheep',   metric: 'heart_rate',       min_value: 60,   max_value: 90,   severity: 'medium', note: 'Adult ewe BPM' },
  { id: 6, species: 'Goat',    metric: 'temperature',      min_value: 38.5, max_value: 40.0, severity: 'high',   note: 'Caprine normal range' },
  { id: 7, species: 'Goat',    metric: 'heart_rate',       min_value: 70,   max_value: 110,  severity: 'medium', note: 'Adult doe/buck BPM' },
  { id: 8, species: 'Swine',   metric: 'temperature',      min_value: 38.7, max_value: 40.0, severity: 'high',   note: 'Porcine core temp' },
  { id: 9, species: 'Swine',   metric: 'respiratory_rate', min_value: 25,   max_value: 40,   severity: 'medium', note: 'Adult sow/boar' },
  { id: 10, species: 'Poultry', metric: 'temperature',     min_value: 40.5, max_value: 42.0, severity: 'high',   note: 'Avian normal range' },
];

let rulesStore = DEFAULT_RULES.map(r => ({ ...r }));
let nextRuleId = rulesStore.reduce((m, r) => Math.max(m, r.id), 0) + 1;

function statusForValue(value, rule) {
  if (value == null || rule == null) return 'unknown';
  const v = Number(value);
  if (!Number.isFinite(v)) return 'unknown';
  if (v < rule.min_value || v > rule.max_value) return rule.severity || 'high';
  return 'normal';
}

function colorForStatus(s) {
  switch (s) {
    case 'normal':  return '#10b981';
    case 'low':     return '#fbbf24';
    case 'medium':  return '#f97316';
    case 'high':    return '#dc2626';
    case 'critical':return '#991b1b';
    default:        return '#94a3b8';
  }
}

// ---------------------------------------------------------------------------
// VIZ 1 — Animal Vitals Trend Chart
//   GET /api/custom-views/animal-vitals-trend?animal_id=ID
// Returns ordered series of health record vitals for a single animal so the
// frontend can render a multi-line chart (temperature/HR/RR/weight).
// ---------------------------------------------------------------------------
router.get('/animal-vitals-trend', auth, async (req, res) => {
  try {
    const animals = await Animal.findAll({
      attributes: ['id', 'tag_id', 'name', 'species', 'breed'],
      order: [['id', 'ASC']],
      limit: 200
    });
    if (animals.length === 0) {
      return res.json({ animals: [], active: null, series: [], metrics: [] });
    }
    const requested = req.query.animal_id ? parseInt(req.query.animal_id, 10) : null;
    const active = (requested && animals.find(a => a.id === requested)) || animals[0];

    const records = await HealthRecord.findAll({
      where: { animal_id: active.id },
      attributes: ['record_date', 'temperature', 'heart_rate', 'respiratory_rate', 'weight', 'body_condition_score', 'status'],
      order: [['record_date', 'ASC']],
      limit: 200
    });

    // Apply per-species rules to flag out-of-range data points.
    const rulesForSpecies = rulesStore.filter(r => r.species === active.species);
    const ruleByMetric = {};
    for (const r of rulesForSpecies) ruleByMetric[r.metric] = r;

    const series = records.map(r => {
      const d = r.record_date instanceof Date
        ? r.record_date.toISOString().slice(0, 10)
        : String(r.record_date || '').slice(0, 10);
      return {
        date: d,
        temperature: r.temperature != null ? Number(r.temperature) : null,
        heart_rate: r.heart_rate != null ? Number(r.heart_rate) : null,
        respiratory_rate: r.respiratory_rate != null ? Number(r.respiratory_rate) : null,
        weight: r.weight != null ? Number(r.weight) : null,
        body_condition_score: r.body_condition_score != null ? Number(r.body_condition_score) : null,
        status: r.status,
        temperature_status: statusForValue(r.temperature, ruleByMetric.temperature),
        heart_rate_status: statusForValue(r.heart_rate, ruleByMetric.heart_rate),
        respiratory_rate_status: statusForValue(r.respiratory_rate, ruleByMetric.respiratory_rate),
      };
    });

    res.json({
      animals: animals.map(a => ({ id: a.id, tag_id: a.tag_id, name: a.name, species: a.species })),
      active: { id: active.id, tag_id: active.tag_id, name: active.name, species: active.species, breed: active.breed },
      metrics: ['temperature', 'heart_rate', 'respiratory_rate', 'weight'],
      thresholds: rulesForSpecies,
      series,
      points: series.length
    });
  } catch (err) {
    console.error('animal-vitals-trend error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// VIZ 2 — Herd Health Heatmap
//   GET /api/custom-views/herd-health-heatmap?herd_id=ID
// Returns matrix [animals x metrics] of most-recent vitals values plus a
// status color derived from per-species rules. Frontend renders as a colored
// grid (rows = animals, cols = metrics).
// ---------------------------------------------------------------------------
router.get('/herd-health-heatmap', auth, async (req, res) => {
  try {
    const herds = await Herd.findAll({
      attributes: ['id', 'name', 'herd_type', 'location'],
      order: [['id', 'ASC']]
    });

    const requestedHerd = req.query.herd_id ? parseInt(req.query.herd_id, 10) : null;
    const animalWhere = {};
    if (requestedHerd) animalWhere.herd_id = requestedHerd;

    const animals = await Animal.findAll({
      where: animalWhere,
      attributes: ['id', 'tag_id', 'name', 'species', 'herd_id'],
      order: [['id', 'ASC']],
      limit: 60
    });

    if (animals.length === 0) {
      return res.json({ herds, activeHerd: requestedHerd, metrics: [], animals: [], matrix: [] });
    }

    const metrics = ['temperature', 'heart_rate', 'respiratory_rate', 'weight', 'body_condition_score'];

    // Latest health record per animal.
    const animalIds = animals.map(a => a.id);
    const records = await HealthRecord.findAll({
      where: { animal_id: animalIds },
      attributes: ['animal_id', 'record_date', 'temperature', 'heart_rate', 'respiratory_rate', 'weight', 'body_condition_score', 'status'],
      order: [['record_date', 'DESC']]
    });
    const latestByAnimal = {};
    for (const r of records) {
      if (!latestByAnimal[r.animal_id]) latestByAnimal[r.animal_id] = r;
    }

    const matrix = animals.map(a => {
      const rec = latestByAnimal[a.id];
      const speciesRules = rulesStore.filter(r => r.species === a.species);
      const ruleByMetric = {};
      for (const r of speciesRules) ruleByMetric[r.metric] = r;
      const cells = {};
      for (const m of metrics) {
        const value = rec ? rec[m] : null;
        const status = statusForValue(value, ruleByMetric[m]);
        cells[m] = {
          value: value != null ? Number(value) : null,
          status,
          color: colorForStatus(status),
        };
      }
      return {
        animal_id: a.id,
        tag_id: a.tag_id,
        name: a.name,
        species: a.species,
        herd_id: a.herd_id,
        record_date: rec && rec.record_date
          ? (rec.record_date instanceof Date ? rec.record_date.toISOString().slice(0, 10) : String(rec.record_date).slice(0, 10))
          : null,
        cells,
      };
    });

    res.json({
      herds: herds.map(h => ({ id: h.id, name: h.name, herd_type: h.herd_type, location: h.location })),
      activeHerd: requestedHerd,
      metrics,
      animals: animals.length,
      matrix,
      legend: [
        { status: 'normal', color: colorForStatus('normal'), label: 'Within range' },
        { status: 'medium', color: colorForStatus('medium'), label: 'Watch' },
        { status: 'high',   color: colorForStatus('high'),   label: 'Out of range' },
        { status: 'critical', color: colorForStatus('critical'), label: 'Critical' },
        { status: 'unknown', color: colorForStatus('unknown'), label: 'No data' },
      ],
    });
  } catch (err) {
    console.error('herd-health-heatmap error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// NON-VIZ 1 — Vet Report PDF
//   GET  /api/custom-views/vet-report-pdf       -> animal picker payload
//   POST /api/custom-views/vet-report-pdf       -> generate PDF (or JSON fallback)
// ---------------------------------------------------------------------------
router.get('/vet-report-pdf', auth, async (req, res) => {
  try {
    const animals = await Animal.findAll({
      attributes: ['id', 'tag_id', 'name', 'species', 'breed', 'gender', 'date_of_birth', 'weight', 'status'],
      order: [['name', 'ASC']],
      limit: 500
    });
    res.json({
      animals,
      vetClinic: 'AI Livestock Veterinary Services',
      clinicAddress: '123 Pasture Lane, AgriCity',
      reportTypes: ['Routine Wellness', 'Disease Investigation', 'Pre-purchase Exam', 'Insurance Claim'],
      pdfReady: !!PDFDocument
    });
  } catch (err) {
    console.error('vet-report-pdf GET error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/vet-report-pdf', auth, async (req, res) => {
  try {
    const { animal_id, report_type, vet_name, findings, recommendations } = req.body || {};
    if (!animal_id) return res.status(400).json({ error: 'animal_id is required' });

    const animal = await Animal.findByPk(parseInt(animal_id, 10), { include: [Herd] });
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const healthRecords = await HealthRecord.findAll({
      where: { animal_id: animal.id },
      order: [['record_date', 'DESC']],
      limit: 10
    });
    const vetVisits = await VetVisit.findAll({
      where: { animal_id: animal.id },
      order: [['visit_date', 'DESC']],
      limit: 5
    });

    const reportId = `VR-${animal.tag_id || animal.id}-${Date.now().toString().slice(-6)}`;
    const reportDate = new Date().toISOString().slice(0, 10);
    const finalFindings = findings || (healthRecords[0] ? healthRecords[0].diagnosis || 'Routine examination completed.' : 'No prior health records.');
    const finalRecs = recommendations || 'Continue routine monitoring. Maintain current vaccination schedule.';

    if (!PDFDocument) {
      return res.json({
        ok: true,
        format: 'json-fallback',
        warning: 'pdfkit not installed; returning JSON report payload',
        report: {
          report_id: reportId,
          report_date: reportDate,
          report_type: report_type || 'Routine Wellness',
          vet_name: vet_name || 'Dr. Field',
          animal: {
            id: animal.id, tag_id: animal.tag_id, name: animal.name, species: animal.species,
            breed: animal.breed, gender: animal.gender, weight: animal.weight, status: animal.status,
            herd: animal.Herd ? animal.Herd.name : null,
          },
          health_records: healthRecords.map(h => ({
            date: h.record_date, temperature: h.temperature, heart_rate: h.heart_rate,
            respiratory_rate: h.respiratory_rate, diagnosis: h.diagnosis, treatment: h.treatment,
            status: h.status,
          })),
          vet_visits: vetVisits.map(v => ({
            date: v.visit_date, veterinarian: v.veterinarian, reason: v.reason,
            diagnosis: v.diagnosis, treatment: v.treatment, cost: v.cost
          })),
          findings: finalFindings,
          recommendations: finalRecs,
        }
      });
    }

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportId}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).fillColor('#0891B2').text('AI Livestock Veterinary Services', { align: 'left' });
    doc.fontSize(10).fillColor('#666').text('123 Pasture Lane, AgriCity', { align: 'left' });
    doc.moveDown();

    doc.fontSize(18).fillColor('#000').text(`Veterinary Report ${reportId}`, { align: 'right' });
    doc.fontSize(10).fillColor('#666').text(`Date: ${reportDate}`, { align: 'right' });
    doc.text(`Report Type: ${report_type || 'Routine Wellness'}`, { align: 'right' });
    doc.text(`Veterinarian: ${vet_name || 'Dr. Field'}`, { align: 'right' });
    doc.moveDown(2);

    doc.fontSize(13).fillColor('#000').text('Animal Information', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333');
    doc.text(`Tag ID: ${animal.tag_id}    Name: ${animal.name}`);
    doc.text(`Species: ${animal.species}    Breed: ${animal.breed || '-'}    Gender: ${animal.gender || '-'}`);
    doc.text(`Weight: ${animal.weight || '-'} kg    Status: ${animal.status}`);
    if (animal.Herd) doc.text(`Herd: ${animal.Herd.name} (${animal.Herd.herd_type})`);
    doc.moveDown();

    doc.fontSize(13).fillColor('#000').text('Recent Health Records', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333');
    if (healthRecords.length === 0) {
      doc.fillColor('#999').text('No prior health records.');
    } else {
      for (const h of healthRecords.slice(0, 5)) {
        const d = h.record_date instanceof Date ? h.record_date.toISOString().slice(0, 10) : String(h.record_date);
        doc.fillColor('#333').text(
          `${d} | T: ${h.temperature || '-'}°C | HR: ${h.heart_rate || '-'} | RR: ${h.respiratory_rate || '-'} | ${h.status || '-'}`
        );
        if (h.diagnosis) doc.fillColor('#555').text(`   Diagnosis: ${h.diagnosis}`);
      }
    }
    doc.moveDown();

    doc.fontSize(13).fillColor('#000').text('Recent Vet Visits', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333');
    if (vetVisits.length === 0) {
      doc.fillColor('#999').text('No prior vet visits.');
    } else {
      for (const v of vetVisits) {
        const d = v.visit_date instanceof Date ? v.visit_date.toISOString().slice(0, 10) : String(v.visit_date);
        doc.fillColor('#333').text(`${d} — ${v.veterinarian || '-'} — ${v.reason || '-'}`);
        if (v.diagnosis) doc.fillColor('#555').text(`   Diagnosis: ${v.diagnosis}`);
      }
    }
    doc.moveDown();

    doc.fontSize(13).fillColor('#000').text('Findings', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333').text(String(finalFindings));
    doc.moveDown();

    doc.fontSize(13).fillColor('#000').text('Recommendations', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor('#333').text(String(finalRecs));
    doc.moveDown(2);

    doc.fontSize(9).fillColor('#888').text(
      `Generated by AI Livestock Health Monitoring on ${new Date().toISOString()}`,
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    console.error('vet-report-pdf POST error', err);
    if (!res.headersSent) res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// NON-VIZ 2 — Health Monitoring Rules Editor (CRUD thresholds per species)
//   GET    /api/custom-views/health-rules
//   POST   /api/custom-views/health-rules
//   PUT    /api/custom-views/health-rules
//   DELETE /api/custom-views/health-rules
// (Multi-verb handled on one path to keep within the "4 endpoints" rule.)
// ---------------------------------------------------------------------------
router.get('/health-rules', auth, async (req, res) => {
  try {
    const species = req.query.species ? String(req.query.species) : null;
    let rules = rulesStore.slice();
    if (species) rules = rules.filter(r => r.species.toLowerCase() === species.toLowerCase());

    res.json({
      rules,
      species: Array.from(new Set(rulesStore.map(r => r.species))).sort(),
      metrics: ['temperature', 'heart_rate', 'respiratory_rate', 'weight', 'body_condition_score'],
      severities: ['low', 'medium', 'high', 'critical'],
      count: rules.length,
    });
  } catch (err) {
    console.error('health-rules GET error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/health-rules', auth, async (req, res) => {
  try {
    const { species, metric, min_value, max_value, severity, note } = req.body || {};
    if (!species || !metric) return res.status(400).json({ error: 'species and metric are required' });
    if (min_value == null || max_value == null) return res.status(400).json({ error: 'min_value and max_value are required' });
    const rule = {
      id: nextRuleId++,
      species: String(species),
      metric: String(metric),
      min_value: Number(min_value),
      max_value: Number(max_value),
      severity: severity || 'medium',
      note: note || '',
    };
    rulesStore.push(rule);
    res.json({ ok: true, rule, total: rulesStore.length });
  } catch (err) {
    console.error('health-rules POST error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/health-rules', auth, async (req, res) => {
  try {
    const { id, species, metric, min_value, max_value, severity, note } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const idx = rulesStore.findIndex(r => r.id === Number(id));
    if (idx < 0) return res.status(404).json({ error: 'Rule not found' });
    const cur = rulesStore[idx];
    rulesStore[idx] = {
      ...cur,
      species: species != null ? String(species) : cur.species,
      metric: metric != null ? String(metric) : cur.metric,
      min_value: min_value != null ? Number(min_value) : cur.min_value,
      max_value: max_value != null ? Number(max_value) : cur.max_value,
      severity: severity != null ? String(severity) : cur.severity,
      note: note != null ? String(note) : cur.note,
    };
    res.json({ ok: true, rule: rulesStore[idx] });
  } catch (err) {
    console.error('health-rules PUT error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/health-rules', auth, async (req, res) => {
  try {
    const id = req.query.id || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: 'id is required' });
    const before = rulesStore.length;
    rulesStore = rulesStore.filter(r => r.id !== Number(id));
    if (rulesStore.length === before) return res.status(404).json({ error: 'Rule not found' });
    res.json({ ok: true, deleted: Number(id), total: rulesStore.length });
  } catch (err) {
    console.error('health-rules DELETE error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
