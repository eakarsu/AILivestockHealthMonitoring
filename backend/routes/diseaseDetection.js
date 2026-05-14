const express = require('express');
const router = express.Router();
const { DiseaseDetection, Animal, Alert } = require('../models');
const { sequelize } = require('../models');
const auth = require('../middleware/auth');
const { predictDisease } = require('../services/aiService');
const { aiRateLimiter } = require('../middleware/rateLimiter');

router.get('/', auth, async (req, res) => {
  try {
    const records = await DiseaseDetection.findAll({ include: [Animal], order: [['detection_date', 'DESC']] });
    res.json(records);
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve disease records' }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const record = await DiseaseDetection.findByPk(req.params.id, { include: [Animal] });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve disease record' }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await DiseaseDetection.create(req.body)); }
  catch (error) { res.status(500).json({ error: 'Failed to create disease record' }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const record = await DiseaseDetection.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (error) { res.status(500).json({ error: 'Failed to update disease record' }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await DiseaseDetection.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) { res.status(500).json({ error: 'Failed to delete disease record' }); }
});

// AI disease prediction — linked to an existing animal record and persisted
router.post('/ai-predict', auth, aiRateLimiter, async (req, res) => {
  try {
    const { symptoms, animalType, history, animal_id } = req.body;

    if (!symptoms) return res.status(400).json({ error: 'symptoms is required' });
    if (!animalType) return res.status(400).json({ error: 'animalType is required' });

    // Optionally link to a real animal record
    let animal = null;
    if (animal_id) {
      animal = await Animal.findByPk(animal_id);
      if (!animal) return res.status(400).json({ error: 'Animal not found' });
    }

    const result = await predictDisease(symptoms, animalType, history || []);
    const content = result.content || '';

    // Extract top disease name from AI response (first disease mentioned after "Likely Diseases")
    const diseaseMatch = content.match(/Likely Diseases[:\s\S]*?(?:\d+\.\s*)([^\n]+)/i);
    const topDisease = diseaseMatch ? diseaseMatch[1].trim() : 'Unknown - See AI analysis';

    // Extract severity from response
    const severityMatch = content.match(/\b(Low|Medium|High|Critical)\b/i);
    const severity = severityMatch ? severityMatch[1] : 'Medium';

    // Persist the disease detection record
    const detectionRecord = await DiseaseDetection.create({
      animal_id: animal_id || (animal ? animal.id : null),
      detection_date: new Date().toISOString().split('T')[0],
      disease_name: topDisease,
      symptoms: Array.isArray(symptoms) ? symptoms.join(', ') : symptoms,
      detection_method: 'AI Prediction',
      ai_analysis: content,
      severity,
      detected_by: req.user?.email || 'System',
      status: 'Active',
      notes: `Animal type: ${animalType}`
    });

    // Auto-create alert for high/critical predictions
    if (severity === 'High' || severity === 'Critical') {
      const targetAnimalId = animal_id || null;
      const animalLabel = animal ? `${animal.name} (${animal.tag_id})` : `${animalType}`;
      await Alert.create({
        animal_id: targetAnimalId,
        alert_type: 'Disease Alert',
        severity,
        title: `${severity} Disease Alert: ${topDisease}`,
        message: `AI disease prediction identified ${topDisease} for ${animalLabel} with ${severity} severity. Immediate veterinary evaluation recommended.`,
        source: 'AI Disease Prediction',
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
            animal_id: animal_id || null,
            user_id: req.user?.id || null,
            analysis_type: 'disease_prediction',
            input_data: JSON.stringify({ symptoms, animalType, history }),
            result: content,
            urgency_level: severity.toLowerCase(),
          },
        }
      );
    } catch (persistErr) {
      console.error('Failed to persist disease prediction:', persistErr.message);
    }

    res.json({
      ...result,
      detectionRecordId: detectionRecord.id,
      topDisease,
      severity,
      persisted: true
    });
  } catch (error) { res.status(500).json({ error: 'Failed to run disease prediction' }); }
});

module.exports = router;
