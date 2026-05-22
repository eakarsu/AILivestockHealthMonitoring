const express = require('express');
const router = express.Router();
function plan(input = {}) {
  const paddocks = input.paddocks || [
    { paddock: 'North 4', fecal_egg_count: 780, grazing_days: 18, rest_days: 12 },
    { paddock: 'Creek Bend', fecal_egg_count: 120, grazing_days: 5, rest_days: 34 },
  ];
  return { paddocks: paddocks.map(p => {
    const score = Math.min(100, Number(p.fecal_egg_count) / 12 + Number(p.grazing_days) * 1.5 - Number(p.rest_days) * 0.5);
    return { ...p, parasite_pressure: Math.round(score), action: score >= 70 ? 'rest_and_deworm_targeted' : score >= 40 ? 'rotate_next_week' : 'available' };
  }) };
}
router.get('/', (req, res) => res.json(plan()));
router.post('/plan', (req, res) => res.json(plan(req.body || {})));
module.exports = router;
