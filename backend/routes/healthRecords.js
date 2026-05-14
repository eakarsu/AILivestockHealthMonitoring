const express = require('express');
const router = express.Router();
const { HealthRecord, Animal, Alert } = require('../models');
const { sequelize } = require('../models');
const auth = require('../middleware/auth');
const { analyzeLivestockHealth } = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const where = {};
    if (req.query.animal_id) where.animal_id = req.query.animal_id;
    const { count, rows } = await HealthRecord.findAndCountAll({
      where,
      include: [Animal],
      order: [['record_date', 'DESC']],
      limit,
      offset,
    });
    res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve health records' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const record = await HealthRecord.findByPk(req.params.id, { include: [Animal] });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve health record' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { animal_id, record_date, temperature, heart_rate, respiratory_rate, weight,
            body_condition_score, symptoms, diagnosis, treatment, veterinarian, status, notes } = req.body;

    if (!animal_id) return res.status(400).json({ error: 'animal_id is required' });
    if (!record_date) return res.status(400).json({ error: 'record_date is required' });

    const animal = await Animal.findByPk(animal_id);
    if (!animal) return res.status(400).json({ error: 'Animal not found' });

    if (temperature !== undefined && (isNaN(temperature) || temperature < 30 || temperature > 45)) {
      return res.status(400).json({ error: 'temperature must be a number between 30 and 45°C' });
    }
    if (heart_rate !== undefined && (isNaN(heart_rate) || heart_rate < 20 || heart_rate > 300)) {
      return res.status(400).json({ error: 'heart_rate must be a number between 20 and 300 bpm' });
    }
    if (body_condition_score !== undefined && (isNaN(body_condition_score) || body_condition_score < 1 || body_condition_score > 9)) {
      return res.status(400).json({ error: 'body_condition_score must be between 1 and 9' });
    }

    const record = await HealthRecord.create({
      animal_id, record_date, temperature, heart_rate, respiratory_rate, weight,
      body_condition_score, symptoms, diagnosis, treatment, veterinarian,
      status: status || 'Normal', notes
    });
    res.status(201).json(record);
  } catch (error) { res.status(500).json({ error: 'Failed to create health record' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const record = await HealthRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const { temperature, heart_rate, body_condition_score } = req.body;
    if (temperature !== undefined && (isNaN(temperature) || temperature < 30 || temperature > 45)) {
      return res.status(400).json({ error: 'temperature must be a number between 30 and 45°C' });
    }
    if (heart_rate !== undefined && (isNaN(heart_rate) || heart_rate < 20 || heart_rate > 300)) {
      return res.status(400).json({ error: 'heart_rate must be a number between 20 and 300 bpm' });
    }
    if (body_condition_score !== undefined && (isNaN(body_condition_score) || body_condition_score < 1 || body_condition_score > 9)) {
      return res.status(400).json({ error: 'body_condition_score must be between 1 and 9' });
    }

    await record.update(req.body);
    res.json(record);
  } catch (error) { res.status(500).json({ error: 'Failed to update health record' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await HealthRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to delete health record' }); }
});

router.post('/:id/ai-analysis', auth, aiRateLimiter, async (req, res) => {
  try {
    const record = await HealthRecord.findByPk(req.params.id, { include: [Animal] });
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const result = await analyzeLivestockHealth(record.toJSON());

    // Extract urgency level from AI response
    const content = result.content || '';
    const urgencyMatch = content.match(/Urgency Level[:\s]*(Low|Medium|High|Critical)/i);
    const urgencyLevel = urgencyMatch ? urgencyMatch[1] : 'Unknown';

    // Persist AI assessment back to the health record
    await record.update({
      ai_assessment: content,
      ai_urgency: urgencyLevel,
      ai_assessed_at: new Date()
    });

    // Auto-create alert for High or Critical urgency
    if (urgencyLevel === 'High' || urgencyLevel === 'Critical') {
      const animal = record.Animal;
      const animalName = animal ? `${animal.name} (${animal.tag_id})` : `Animal #${record.animal_id}`;
      await Alert.create({
        animal_id: record.animal_id,
        alert_type: 'Health Assessment',
        severity: urgencyLevel,
        title: `${urgencyLevel} Health Alert: ${animalName}`,
        message: `AI health analysis returned ${urgencyLevel} urgency for ${animalName}. Immediate veterinary attention recommended.\n\nKey findings: ${content.substring(0, 500)}...`,
        source: 'AI Analysis',
        is_read: false,
        is_resolved: false
      });
    }

    // Persist to ai_analyses table
    try {
      await sequelize.query(
        `INSERT INTO ai_analyses (animal_id, user_id, analysis_type, input_data, result, urgency_level)
         VALUES (:animal_id, :user_id, :analysis_type, :input_data, :result, :urgency_level)`,
        {
          replacements: {
            animal_id: record.animal_id,
            user_id: req.user?.id || null,
            analysis_type: 'health_record_analysis',
            input_data: JSON.stringify(record.toJSON()),
            result: content,
            urgency_level: urgencyLevel.toLowerCase(),
          },
        }
      );
    } catch (persistErr) {
      console.error('Failed to persist to ai_analyses:', persistErr.message);
    }

    res.json({
      ...result,
      urgencyLevel,
      persisted: true,
      alertCreated: urgencyLevel === 'High' || urgencyLevel === 'Critical'
    });
  } catch (error) { res.status(500).json({ error: 'Failed to run AI analysis' }); }
});

module.exports = router;
