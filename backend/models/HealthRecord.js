const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HealthRecord = sequelize.define('HealthRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  record_date: { type: DataTypes.DATEONLY, allowNull: false },
  temperature: { type: DataTypes.FLOAT },
  heart_rate: { type: DataTypes.INTEGER },
  respiratory_rate: { type: DataTypes.INTEGER },
  weight: { type: DataTypes.FLOAT },
  body_condition_score: { type: DataTypes.FLOAT },
  symptoms: { type: DataTypes.TEXT },
  diagnosis: { type: DataTypes.TEXT },
  treatment: { type: DataTypes.TEXT },
  veterinarian: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Normal' },
  notes: { type: DataTypes.TEXT },
  ai_assessment: { type: DataTypes.TEXT },
  ai_urgency: { type: DataTypes.STRING },
  ai_assessed_at: { type: DataTypes.DATE }
});

module.exports = HealthRecord;
