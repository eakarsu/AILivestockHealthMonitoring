const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DiseaseDetection = sequelize.define('DiseaseDetection', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  detection_date: { type: DataTypes.DATEONLY, allowNull: false },
  disease_name: { type: DataTypes.STRING, allowNull: false },
  symptoms: { type: DataTypes.TEXT },
  confidence_level: { type: DataTypes.FLOAT },
  detection_method: { type: DataTypes.STRING },
  ai_analysis: { type: DataTypes.TEXT },
  severity: { type: DataTypes.STRING },
  contagious: { type: DataTypes.BOOLEAN, defaultValue: false },
  quarantine_required: { type: DataTypes.BOOLEAN, defaultValue: false },
  treatment_plan: { type: DataTypes.TEXT },
  detected_by: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  notes: { type: DataTypes.TEXT }
});

module.exports = DiseaseDetection;
