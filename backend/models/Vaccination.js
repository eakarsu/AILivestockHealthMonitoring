const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vaccination = sequelize.define('Vaccination', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  vaccine_name: { type: DataTypes.STRING, allowNull: false },
  vaccine_type: { type: DataTypes.STRING },
  date_administered: { type: DataTypes.DATEONLY, allowNull: false },
  next_due_date: { type: DataTypes.DATEONLY },
  dosage: { type: DataTypes.STRING },
  batch_number: { type: DataTypes.STRING },
  administered_by: { type: DataTypes.STRING },
  site: { type: DataTypes.STRING },
  reaction: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'Completed' },
  notes: { type: DataTypes.TEXT }
});

module.exports = Vaccination;
