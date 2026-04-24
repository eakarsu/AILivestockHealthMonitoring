const express = require('express');
const router = express.Router();
const { FinancialRecord } = require('../models');
const auth = require('../middleware/auth');
const { financialAnalysis } = require('../services/aiService');

router.get('/', auth, async (req, res) => {
  try {
    const records = await FinancialRecord.findAll({ order: [['date', 'DESC']] });
    res.json(records);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const record = await FinancialRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await FinancialRecord.create(req.body)); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const record = await FinancialRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.update(req.body);
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await FinancialRecord.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.destroy();
    res.json({ message: 'Record deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/ai-analysis', auth, async (req, res) => {
  try {
    const records = await FinancialRecord.findAll({ limit: 50, order: [['date', 'DESC']] });
    const result = await financialAnalysis(records.map(r => r.toJSON()));
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
