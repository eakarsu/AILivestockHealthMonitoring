const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medication = sequelize.define('Medication', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  medication_name: { type: DataTypes.STRING, allowNull: false },
  medication_type: { type: DataTypes.STRING },
  dosage: { type: DataTypes.STRING },
  frequency: { type: DataTypes.STRING },
  start_date: { type: DataTypes.DATEONLY, allowNull: false },
  end_date: { type: DataTypes.DATEONLY },
  prescribed_by: { type: DataTypes.STRING },
  reason: { type: DataTypes.STRING },
  side_effects: { type: DataTypes.TEXT },
  withdrawal_period: { type: DataTypes.STRING },
  cost: { type: DataTypes.FLOAT },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  notes: { type: DataTypes.TEXT }
});

module.exports = Medication;
