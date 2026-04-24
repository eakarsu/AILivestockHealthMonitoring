const express = require('express');
const router = express.Router();
const { MilkProduction, Animal } = require('../models');
const auth = require('../middleware/auth');
const { milkProductionAnalysis } = require('../services/aiService');

router.get('/', auth, async (req, res) => {
  try {
    const records = await MilkProduction.findAll({ include: [Animal], order: [['production_date', 'DESC']] });
    res.json(records);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const record = await MilkProduction.findByPk(req.params.id, { include: [Animal] });
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await MilkProduction.create(req.body)); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const record = await MilkProduction.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await MilkProduction.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/ai-analysis', auth, async (req, res) => {
  try {
    const records = await MilkProduction.findAll({ include: [Animal], limit: 50, order: [['production_date', 'DESC']] });
    const result = await milkProductionAnalysis(records.map(r => r.toJSON()));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
