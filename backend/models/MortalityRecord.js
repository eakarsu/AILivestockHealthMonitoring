const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MortalityRecord = sequelize.define('MortalityRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER, allowNull: false },
  date_of_death: { type: DataTypes.DATEONLY, allowNull: false },
  cause_of_death: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING },
  age_at_death: { type: DataTypes.STRING },
  symptoms_before_death: { type: DataTypes.TEXT },
  autopsy_performed: { type: DataTypes.BOOLEAN, defaultValue: false },
  autopsy_findings: { type: DataTypes.TEXT },
  economic_loss: { type: DataTypes.FLOAT },
  preventable: { type: DataTypes.BOOLEAN },
  reported_by: { type: DataTypes.STRING },
  veterinarian: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT }
});

module.exports = MortalityRecord;
