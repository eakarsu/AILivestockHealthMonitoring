const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MilkProduction = sequelize.define('MilkProduction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  production_date: { type: DataTypes.DATEONLY, allowNull: false },
  session: { type: DataTypes.STRING },
  quantity_liters: { type: DataTypes.FLOAT, allowNull: false },
  fat_percentage: { type: DataTypes.FLOAT },
  protein_percentage: { type: DataTypes.FLOAT },
  somatic_cell_count: { type: DataTypes.INTEGER },
  temperature: { type: DataTypes.FLOAT },
  quality_grade: { type: DataTypes.STRING },
  storage_tank: { type: DataTypes.STRING },
  recorded_by: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

module.exports = MilkProduction;
