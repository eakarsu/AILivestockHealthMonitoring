const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeightTracking = sequelize.define('WeightTracking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  weight: { type: DataTypes.FLOAT, allowNull: false },
  measurement_date: { type: DataTypes.DATEONLY, allowNull: false },
  method: { type: DataTypes.STRING },
  body_condition_score: { type: DataTypes.FLOAT },
  daily_gain: { type: DataTypes.FLOAT },
  target_weight: { type: DataTypes.FLOAT },
  measured_by: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

module.exports = WeightTracking;
