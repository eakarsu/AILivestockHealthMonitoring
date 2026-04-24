const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VetVisit = sequelize.define('VetVisit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  visit_date: { type: DataTypes.DATEONLY, allowNull: false },
  veterinarian: { type: DataTypes.STRING, allowNull: false },
  clinic: { type: DataTypes.STRING },
  reason: { type: DataTypes.STRING, allowNull: false },
  diagnosis: { type: DataTypes.TEXT },
  treatment: { type: DataTypes.TEXT },
  prescription: { type: DataTypes.TEXT },
  follow_up_date: { type: DataTypes.DATEONLY },
  cost: { type: DataTypes.FLOAT },
  status: { type: DataTypes.STRING, defaultValue: 'Completed' },
  notes: { type: DataTypes.TEXT }
});

module.exports = VetVisit;
