const express = require('express');
const router = express.Router();
const { Animal, Herd } = require('../models');
const auth = require('../middleware/auth');
const { analyzeLivestockHealth } = require('../services/aiService');

router.get('/', auth, async (req, res) => {
  try {
    const animals = await Animal.findAll({ include: [Herd], order: [['createdAt', 'DESC']] });
    res.json(animals);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id, { include: [Herd] });
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    res.json(animal);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const animal = await Animal.create(req.body);
    res.status(201).json(animal);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    await animal.update(req.body);
    res.json(animal);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    await animal.destroy();
    res.json({ message: 'Animal deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/:id/ai-analysis', auth, async (req, res) => {
  try {
    const animal = await Animal.findByPk(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    const result = await analyzeLivestockHealth(animal.toJSON());
    res.json(result);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
