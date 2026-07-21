'use strict';
const { createRouter } = require('./router');
const { sequelize: adapt } = require('./store');
const { sequelize } = require('../models');
const auth = require('../middleware/auth');
const { evaluate } = require('./domain');
module.exports = createRouter({ db: adapt(sequelize), auth, evaluate,
  workflow: 'veterinary-health-monitoring',
  providers: ['veterinary-records','laboratory','imaging','iot-device','pharmacy','scheduling','notifications'],
  approverRoles: ['veterinarian','herd_manager','animal_health_officer','admin'] });

