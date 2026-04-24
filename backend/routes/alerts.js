const express = require('express');
const router = express.Router();
const { Alert, Animal } = require('../models');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const records = await Alert.findAll({ include: [Animal], order: [['createdAt', 'DESC']] });
    res.json(records);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const record = await Alert.findByPk(req.params.id, { include: [Animal] });
    if (!record) return res.status(404).json({ error: 'Alert not found' });
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try { res.status(201).json(await Alert.create(req.body)); }
  catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const record = await Alert.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Alert not found' });
    await record.update(req.body);
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await Alert.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Alert not found' });
    await record.destroy();
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const record = await Alert.findByPk(req.params.id);
    if (!record) return res.status(404).json({ error: 'Alert not found' });
    await record.update({ is_resolved: true, resolved_by: req.user.name, resolved_at: new Date() });
    res.json(record);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
