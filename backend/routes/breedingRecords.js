const express = require('express');
const router = express.Router();
const { BreedingRecord, Animal } = require('../models');
const auth = require('../middleware/auth');
const { breedingRecommendation } = require('../services/aiService');

router.get('/', auth, async (req, res) => {
  try {
    const records = await BreedingRecord.findAll({ include: [Animal], order: [['breeding_date', 'DESC']] });
    res.json(records);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const record = await BreedingRecord.findByPk(req.params.id, { include: [Animal] });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await BreedingRecord.create(req.body)); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const record = await BreedingRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await BreedingRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/:id/ai-recommendation', auth, async (req, res) => {
  try {
    const record = await BreedingRecord.findByPk(req.params.id, { include: [Animal] });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    const result = await breedingRecommendation(record.toJSON());
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
