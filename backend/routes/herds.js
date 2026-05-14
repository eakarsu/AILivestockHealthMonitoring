const express = require('express');
const router = express.Router();
const { Herd, Animal, HealthRecord, Alert, Vaccination } = require('../models');
const { sequelize } = require('../models');
const auth = require('../middleware/auth');
const { queryAI } = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { Op } = require('sequelize');

router.get('/', auth, async (req, res) => {
  try {
    const records = await Herd.findAll({ include: [Animal], order: [['name', 'ASC']] });
    res.json(records);
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve herds' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const record = await Herd.findByPk(req.params.id, { include: [Animal] });
    if (!record) return res.status(404).json({ error: 'Herd not found' });
    res.json(record);
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve herd' }); }
});

// GET /api/herds/:id/health-summary
// Aggregates individual animal health records for the herd and calls AI for herd-level insights.
router.get('/:id/health-summary', auth, async (req, res) => {
  try {
    const herd = await Herd.findByPk(req.params.id, { include: [Animal] });
    if (!herd) return res.status(404).json({ error: 'Herd not found' });

    const animals = herd.Animals || [];
    if (animals.length === 0) {
      return res.json({
        herd_id: herd.id,
        herd_name: herd.name,
        animal_count: 0,
        message: 'No animals in this herd',
        summary: null
      });
    }

    const animalIds = animals.map(a => a.id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch recent health records for all animals in the herd
    const recentHealthRecords = await HealthRecord.findAll({
      where: {
        animal_id: { [Op.in]: animalIds },
        record_date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] }
      },
      order: [['record_date', 'DESC']]
    });

    // Fetch active alerts for herd
    const activeAlerts = await Alert.findAll({
      where: {
        animal_id: { [Op.in]: animalIds },
        is_resolved: false
      }
    });

    // Fetch upcoming vaccinations (next 30 days)
    const upcomingVaccinations = await Vaccination.findAll({
      where: {
        animal_id: { [Op.in]: animalIds },
        next_due_date: {
          [Op.gte]: new Date().toISOString().split('T')[0],
          [Op.lte]: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      },
      include: [Animal]
    });

    // Build aggregate statistics
    const animalStatusCounts = {};
    const speciesCounts = {};
    for (const animal of animals) {
      animalStatusCounts[animal.status] = (animalStatusCounts[animal.status] || 0) + 1;
      speciesCounts[animal.species] = (speciesCounts[animal.species] || 0) + 1;
    }

    const recordsByAnimal = {};
    for (const record of recentHealthRecords) {
      if (!recordsByAnimal[record.animal_id]) recordsByAnimal[record.animal_id] = [];
      recordsByAnimal[record.animal_id].push(record);
    }

    // Build urgency distribution from AI assessments
    const urgencyDistribution = { Low: 0, Medium: 0, High: 0, Critical: 0, Unknown: 0 };
    const avgMetrics = { temperature: [], heart_rate: [], weight: [], body_condition_score: [] };

    for (const record of recentHealthRecords) {
      if (record.ai_urgency) urgencyDistribution[record.ai_urgency] = (urgencyDistribution[record.ai_urgency] || 0) + 1;
      if (record.temperature) avgMetrics.temperature.push(record.temperature);
      if (record.heart_rate) avgMetrics.heart_rate.push(record.heart_rate);
      if (record.weight) avgMetrics.weight.push(record.weight);
      if (record.body_condition_score) avgMetrics.body_condition_score.push(record.body_condition_score);
    }

    const avg = (arr) => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2) : null;

    const herdStats = {
      herd_id: herd.id,
      herd_name: herd.name,
      herd_type: herd.herd_type,
      location: herd.location,
      total_animals: animals.length,
      animal_status_distribution: animalStatusCounts,
      species_distribution: speciesCounts,
      health_records_last_30_days: recentHealthRecords.length,
      animals_with_recent_records: Object.keys(recordsByAnimal).length,
      active_alerts: activeAlerts.length,
      alert_severity_breakdown: activeAlerts.reduce((acc, a) => {
        acc[a.severity] = (acc[a.severity] || 0) + 1;
        return acc;
      }, {}),
      ai_urgency_distribution: urgencyDistribution,
      average_metrics: {
        temperature: avg(avgMetrics.temperature),
        heart_rate: avg(avgMetrics.heart_rate),
        weight: avg(avgMetrics.weight),
        body_condition_score: avg(avgMetrics.body_condition_score)
      },
      upcoming_vaccinations_count: upcomingVaccinations.length,
      upcoming_vaccinations: upcomingVaccinations.map(v => ({
        animal: v.Animal ? `${v.Animal.name} (${v.Animal.tag_id})` : `Animal #${v.animal_id}`,
        vaccine: v.vaccine_name,
        due_date: v.next_due_date
      }))
    };

    // Call AI for herd-level insights
    const systemPrompt = `You are a veterinary AI specialist for herd health management. Analyze herd-level health statistics and provide actionable insights.
    Format your response with sections: Herd Health Overview, Key Concerns, Recommended Actions, Preventive Measures, and Overall Herd Risk Level (Low/Medium/High/Critical).`;

    const prompt = `Analyze the following herd health summary and provide herd-level veterinary insights:
    ${JSON.stringify(herdStats, null, 2)}`;

    let aiInsights = null;
    let aiError = null;
    try {
      const aiResult = await queryAI(prompt, systemPrompt);
      aiInsights = aiResult.content;
    } catch (aiErr) {
      aiError = 'AI analysis unavailable — showing aggregated statistics only';
      console.error('Herd health AI error:', aiErr.message);
    }

    res.json({
      ...herdStats,
      ai_insights: aiInsights,
      ai_error: aiError,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Herd health summary error:', error);
    res.status(500).json({ error: 'Failed to generate herd health summary' });
  }
});

// POST /api/herds/:id/risk-assessment — AI herd outbreak risk scoring
router.post('/:id/risk-assessment', auth, aiRateLimiter, async (req, res) => {
  try {
    const herd = await Herd.findByPk(req.params.id, { include: [Animal] });
    if (!herd) return res.status(404).json({ error: 'Herd not found' });

    const animals = herd.Animals || [];
    const animalIds = animals.map(a => a.id);

    // Fetch recent health records (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentHealthRecords = animalIds.length > 0
      ? await HealthRecord.findAll({
          where: {
            animal_id: { [Op.in]: animalIds },
            record_date: { [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0] },
          },
          order: [['record_date', 'DESC']],
          limit: 100,
        })
      : [];

    // Species breakdown
    const speciesCounts = {};
    for (const a of animals) {
      speciesCounts[a.species] = (speciesCounts[a.species] || 0) + 1;
    }

    // Urgency distribution from health records
    const urgencyDist = { critical: 0, high: 0, medium: 0, low: 0, unknown: 0 };
    for (const r of recentHealthRecords) {
      const u = (r.ai_urgency || 'unknown').toLowerCase();
      urgencyDist[u] = (urgencyDist[u] || 0) + 1;
    }

    const herdData = {
      herd_id: herd.id,
      herd_name: herd.name,
      herd_type: herd.herd_type,
      location: herd.location,
      total_animals: animals.length,
      species_breakdown: speciesCounts,
      health_records_last_30_days: recentHealthRecords.length,
      urgency_distribution: urgencyDist,
    };

    const systemPrompt = 'You are a veterinary herd disease risk AI. Analyze herd data and return a structured JSON risk assessment. Always respond with valid JSON only, no markdown.';
    const userPrompt = `Analyze this herd data and predict outbreak probability. Return JSON: { "herd_id": number, "risk_score": number (0-100), "risk_level": "low"|"medium"|"high"|"critical", "species_risks": [{"species": string, "risk": string, "reason": string}], "recommendations": [string] }

Herd data: ${JSON.stringify(herdData, null, 2)}`;

    let assessment = null;
    try {
      const aiResult = await queryAI(userPrompt, systemPrompt);
      const content = aiResult.content || '';
      // Parse JSON from response
      try { assessment = JSON.parse(content); } catch (e) {}
      if (!assessment) {
        const stripped = content.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
        try { assessment = JSON.parse(stripped); } catch (e) {}
      }
      if (!assessment) {
        const s = content.indexOf('{'); const en = content.lastIndexOf('}');
        if (s !== -1 && en !== -1) { try { assessment = JSON.parse(content.slice(s, en + 1)); } catch (e) {} }
      }

      // Persist to ai_analyses
      try {
        await sequelize.query(
          `INSERT INTO ai_analyses (animal_id, user_id, analysis_type, input_data, result, urgency_level)
           VALUES (:animal_id, :user_id, :analysis_type, :input_data, :result, :urgency_level)`,
          {
            replacements: {
              animal_id: null,
              user_id: req.user?.id || null,
              analysis_type: 'herd_risk_assessment',
              input_data: JSON.stringify(herdData),
              result: content,
              urgency_level: assessment?.risk_level || null,
            },
          }
        );
      } catch (persistErr) {
        console.error('Failed to persist herd risk assessment:', persistErr.message);
      }
    } catch (aiErr) {
      console.error('Herd risk AI error:', aiErr.message);
    }

    if (!assessment) {
      return res.status(503).json({ error: 'AI service temporarily unavailable' });
    }

    res.json({ ...assessment, herd_id: herd.id, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error('Herd risk assessment error:', error);
    res.status(500).json({ error: 'Failed to run risk assessment' });
  }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await Herd.create(req.body)); }
  catch (error) { res.status(500).json({ error: 'Failed to create herd' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const record = await Herd.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Herd not found' });
    await record.update(req.body);
    res.json(record);
  } catch (error) { res.status(500).json({ error: 'Failed to update herd' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await Herd.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Herd not found' });
    await record.destroy();
    res.json({ message: 'Herd deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to delete herd' }); }
});

module.exports = router;
