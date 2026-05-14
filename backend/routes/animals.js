const express = require('express');
const router = express.Router();
const { Animal, Herd } = require('../models');
const { sequelize } = require('../models');
const auth = require('../middleware/auth');
const { analyzeLivestockHealth } = require('../services/aiService');

const VALID_SPECIES = ['cattle', 'sheep', 'goat', 'pig', 'horse', 'chicken', 'turkey', 'duck', 'rabbit', 'other'];
const VALID_GENDERS = ['male', 'female', 'unknown'];
const VALID_STATUSES = ['Active', 'Inactive', 'Sold', 'Deceased', 'Quarantined'];

function validateAnimalBody(body, requireRequired = true) {
  const { tag_id, name, species, gender, weight, status, date_of_birth, purchase_date } = body;
  const errors = [];

  if (requireRequired) {
    if (!tag_id || typeof tag_id !== 'string' || tag_id.trim() === '') {
      errors.push('tag_id is required and must be a non-empty string');
    }
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('name is required and must be a non-empty string');
    }
    if (!species || typeof species !== 'string' || species.trim() === '') {
      errors.push('species is required');
    }
  }

  if (weight !== undefined && (isNaN(weight) || weight <= 0)) {
    errors.push('weight must be a positive number');
  }
  if (date_of_birth && isNaN(Date.parse(date_of_birth))) {
    errors.push('date_of_birth must be a valid date');
  }
  if (purchase_date && isNaN(Date.parse(purchase_date))) {
    errors.push('purchase_date must be a valid date');
  }
  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  return errors;
}

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { count, rows } = await Animal.findAndCountAll({
      include: [Herd],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve animals' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id, { include: [Herd] });
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    res.json(animal);
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve animal' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const errors = validateAnimalBody(req.body, true);
    if (errors.length > 0) return res.status(400).json({ errors });

    if (req.body.herd_id) {
      const herd = await Herd.findByPk(req.body.herd_id);
      if (!herd) return res.status(400).json({ error: 'Herd not found' });
    }

    const existing = await Animal.findOne({ where: { tag_id: req.body.tag_id.trim() } });
    if (existing) return res.status(409).json({ error: `Tag ID '${req.body.tag_id}' is already in use` });

    const animal = await Animal.create({
      tag_id: req.body.tag_id.trim(),
      name: req.body.name.trim(),
      species: req.body.species.trim(),
      breed: req.body.breed,
      date_of_birth: req.body.date_of_birth || null,
      gender: req.body.gender,
      weight: req.body.weight,
      color: req.body.color,
      status: req.body.status || 'Active',
      purchase_date: req.body.purchase_date || null,
      purchase_price: req.body.purchase_price,
      herd_id: req.body.herd_id || null,
      notes: req.body.notes
    });
    res.status(201).json(animal);
  } catch (error) { res.status(500).json({ error: 'Failed to create animal' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const errors = validateAnimalBody(req.body, false);
    if (errors.length > 0) return res.status(400).json({ errors });

    if (req.body.tag_id && req.body.tag_id.trim() !== animal.tag_id) {
      const existing = await Animal.findOne({ where: { tag_id: req.body.tag_id.trim() } });
      if (existing) return res.status(409).json({ error: `Tag ID '${req.body.tag_id}' is already in use` });
    }

    await animal.update(req.body);
    res.json(animal);
  } catch (error) { res.status(500).json({ error: 'Failed to update animal' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    await animal.destroy();
    res.json({ message: 'Animal deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to delete animal' }); }
});

router.post('/:id/ai-analysis', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    const result = await analyzeLivestockHealth(animal.toJSON());

    // Persist to ai_analyses
    try {
      await sequelize.query(
        `INSERT INTO ai_analyses (animal_id, user_id, analysis_type, input_data, result, urgency_level)
         VALUES (:animal_id, :user_id, :analysis_type, :input_data, :result, :urgency_level)`,
        {
          replacements: {
            animal_id: req.params.id,
            user_id: req.user?.id || null,
            analysis_type: 'health_analysis',
            input_data: JSON.stringify(animal.toJSON()),
            result: result.content || '',
            urgency_level: null,
          },
        }
      );
    } catch (persistErr) {
      console.error('Failed to persist AI analysis:', persistErr.message);
    }

    res.json(result);
  } catch (error) { res.status(500).json({ error: 'Failed to run AI analysis' }); }
});

// GET /api/animals/:id/health-trend — time-series urgency data for Recharts
router.get('/:id/health-trend', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const [rows] = await sequelize.query(
      `SELECT created_at AS date, urgency_level, analysis_type
       FROM ai_analyses
       WHERE animal_id = :animal_id
       ORDER BY created_at ASC`,
      { replacements: { animal_id: req.params.id } }
    );

    // Map urgency level to numeric value for chart
    const urgencyMap = { critical: 4, high: 3, medium: 2, low: 1 };
    const trend = rows.map(r => ({
      date: r.date,
      analysis_type: r.analysis_type,
      urgency_level: r.urgency_level,
      urgency_score: urgencyMap[(r.urgency_level || '').toLowerCase()] || 0,
    }));

    res.json(trend);
  } catch (error) {
    console.error('Health trend error:', error);
    res.status(500).json({ error: 'Failed to retrieve health trend' });
  }
});

module.exports = router;
