const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BreedingRecord = sequelize.define('BreedingRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  mate_id: { type: DataTypes.INTEGER },
  breeding_date: { type: DataTypes.DATEONLY, allowNull: false },
  method: { type: DataTypes.STRING },
  expected_due_date: { type: DataTypes.DATEONLY },
  actual_birth_date: { type: DataTypes.DATEONLY },
  offspring_count: { type: DataTypes.INTEGER },
  pregnancy_status: { type: DataTypes.STRING, defaultValue: 'Pending' },
  sire_info: { type: DataTypes.STRING },
  genetic_notes: { type: DataTypes.TEXT },
  complications: { type: DataTypes.TEXT },
  veterinarian: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  notes: { type: DataTypes.TEXT }
});

module.exports = BreedingRecord;
