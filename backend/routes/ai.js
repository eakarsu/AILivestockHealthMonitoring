const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { Animal, HealthRecord, Vaccination, FeedManagement, BreedingRecord, FinancialRecord } = require('../models');

function ensureAIKey(res) {
  if (!process.env.OPENROUTER_API_KEY) {
    res.status(503).json({ error: 'OPENROUTER_API_KEY is not configured. AI features unavailable.' });
    return false;
  }
  return true;
}

function parseJson(text) {
  if (!text) return null;
  const stripped = String(text).replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try { return JSON.parse(stripped); } catch (_) {}
  const start = stripped.indexOf('{'); const end = stripped.lastIndexOf('}');
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(stripped.slice(start, end + 1)); } catch (_) {}
  }
  return null;
}

// POST /api/ai/disease-risk-assessment
router.post('/disease-risk-assessment', async (req, res) => {
  try {
    const { herdId, animalIds, weather } = req.body;
    const animals = animalIds && animalIds.length
      ? await Animal.findAll({ where: { id: animalIds } })
      : (herdId ? await Animal.findAll({ where: { herd_id: herdId } }) : await Animal.findAll({ limit: 25 }));
    const recentVacc = await Vaccination.findAll({ limit: 50, order: [['createdAt', 'DESC']] });

    const systemPrompt = 'You are a veterinary epidemiologist. Respond with valid JSON only, no markdown fences.';
    const prompt = `Assess disease outbreak risk.

Animals (${animals.length}): ${animals.slice(0, 30).map(a => `id=${a.id} type=${a.type || a.species} age=${a.age} status=${a.healthStatus}`).join('; ')}
Recent vaccinations (${recentVacc.length}): ${recentVacc.slice(0, 20).map(v => `${v.vaccineName} on animal ${v.animalId}`).join('; ')}
Weather context: ${weather ? JSON.stringify(weather) : 'unspecified'}

Return JSON: { overall_risk_level ("low"|"medium"|"high"|"critical"), top_risks: [{ disease, likelihood, evidence, recommended_action }], priority_actions: [], quarantine_recommendations: [] }`;

    const result = await aiService.queryAI(prompt, systemPrompt);
    res.json({ raw: result.content, structured: parseJson(result.content), model: result.model, usage: result.usage });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/ai/breeding-advisor — recommend pairings
router.post('/breeding-advisor', async (req, res) => {
  try {
    const { animalId } = req.body;
    if (!animalId) return res.status(400).json({ error: 'animalId is required' });
    const animal = await Animal.findByPk(animalId);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    const candidates = await Animal.findAll({ where: { species: animal.species }, limit: 30 });
    const lineage = await BreedingRecord.findAll({ limit: 30, order: [['createdAt', 'DESC']] });

    const systemPrompt = 'You are a livestock geneticist. Respond with valid JSON only, no markdown fences.';
    const prompt = `Recommend breeding pairings for animal id=${animal.id} (${animal.species}, ${animal.breed || 'unknown breed'}, ${animal.gender || 'unknown sex'}).

Candidate mates: ${candidates.filter(c => c.id !== animal.id).slice(0, 20).map(c => `id=${c.id}, ${c.breed || '?'}, ${c.gender || '?'}, age=${c.age}`).join('; ')}
Recent breeding history: ${lineage.slice(0, 10).map(b => `parents=${b.maleId}/${b.femaleId} outcome=${b.outcome || 'n/a'}`).join('; ')}

Return JSON: { recommended_pairings: [{ candidate_id, score (0-100), genetic_rationale, expected_traits, inbreeding_concern ("low"|"medium"|"high") }], avoid_pairings: [{ candidate_id, reason }], notes }`;

    const result = await aiService.queryAI(prompt, systemPrompt);
    res.json({ raw: result.content, structured: parseJson(result.content), model: result.model, usage: result.usage });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/ai/health-anomaly-detector
router.post('/health-anomaly-detector', async (req, res) => {
  try {
    const { animalId, herdId } = req.body;
    const where = animalId ? { animal_id: animalId } : {};
    const recentHealth = await HealthRecord.findAll({ where, limit: 50, order: [['createdAt', 'DESC']] });

    const systemPrompt = 'You are a livestock veterinary AI. Respond with valid JSON only, no markdown fences.';
    const prompt = `Identify health anomalies given recent health record signals.

Records (${recentHealth.length}): ${recentHealth.slice(0, 30).map(h => `animal=${h.animalId} date=${h.recordDate || h.createdAt} temp=${h.temperature || 'n/a'} pulse=${h.pulse || 'n/a'} notes=${(h.notes || '').slice(0, 60)}`).join('; ')}

Return JSON: { anomalies: [{ animal_id, signal, severity ("low"|"medium"|"high"|"critical"), recommended_action }], herd_level_concerns: [], false_positive_likelihood ("low"|"medium"|"high") }`;

    const result = await aiService.queryAI(prompt, systemPrompt);
    res.json({ raw: result.content, structured: parseJson(result.content), model: result.model, usage: result.usage });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/ai/nutrition-optimizer
router.post('/nutrition-optimizer', async (req, res) => {
  if (!ensureAIKey(res)) return;
  try {
    const { herdId, animalId, targetGoal } = req.body;
    const animals = animalId
      ? await Animal.findAll({ where: { id: animalId } })
      : (herdId ? await Animal.findAll({ where: { herd_id: herdId } }) : await Animal.findAll({ limit: 25 }));
    const feeds = await FeedManagement.findAll({ limit: 30, order: [['createdAt', 'DESC']] });

    const systemPrompt = 'You are a livestock nutritionist. Respond with valid JSON only, no markdown fences.';
    const prompt = `Optimize nutrition for the following herd subset.

Animals (${animals.length}): ${animals.slice(0, 25).map(a => `id=${a.id} species=${a.species || a.type} breed=${a.breed || '?'} age=${a.age} weight=${a.weight || '?'} status=${a.healthStatus || a.status || '?'}`).join('; ')}
Recent feed plans (${feeds.length}): ${feeds.slice(0, 15).map(f => `id=${f.id} type=${f.feedType || f.type || '?'} qty=${f.quantity || '?'} cost=${f.cost || '?'}`).join('; ')}
Target goal: ${targetGoal || 'balanced growth + maintenance'}

Return JSON: { current_assessment, recommended_diet: [{ feed_type, daily_kg_per_animal, rationale }], nutritional_gaps: [{ nutrient, severity, fix }], cost_optimization: { estimated_savings_pct, notes }, expected_outcomes: [], risks: [] }`;

    const result = await aiService.queryAI(prompt, systemPrompt);
    res.json({ raw: result.content, structured: parseJson(result.content), model: result.model, usage: result.usage });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// POST /api/ai/economic-forecaster
router.post('/economic-forecaster', async (req, res) => {
  if (!ensureAIKey(res)) return;
  try {
    const { horizonMonths = 12, marketContext } = req.body;
    const recentFinancial = await FinancialRecord.findAll({ limit: 60, order: [['createdAt', 'DESC']] });
    const animalCount = await Animal.count();

    const systemPrompt = 'You are an agricultural-economics analyst for a livestock operation. Respond with valid JSON only, no markdown fences.';
    const prompt = `Forecast the farm economics over the next ${horizonMonths} months.

Recent financial records (${recentFinancial.length}): ${recentFinancial.slice(0, 30).map(f => `${f.recordDate || f.createdAt}: ${f.type || f.category || '?'} amount=${f.amount} note=${(f.notes || '').slice(0, 40)}`).join('; ')}
Active animals: ${animalCount}
Market context: ${marketContext ? JSON.stringify(marketContext) : 'unspecified'}

Return JSON: { revenue_forecast_usd: [{ month_index, low, expected, high }], cost_forecast_usd: [{ month_index, low, expected, high }], net_margin_forecast: { expected_pct, range }, biggest_drivers: [{ driver, direction, impact }], scenario_alerts: [{ scenario, likelihood, action }], recommendations: [] }`;

    const result = await aiService.queryAI(prompt, systemPrompt);
    res.json({ raw: result.content, structured: parseJson(result.content), model: result.model, usage: result.usage });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
