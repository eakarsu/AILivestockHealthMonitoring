const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER },
  alert_type: { type: DataTypes.STRING, allowNull: false },
  severity: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  source: { type: DataTypes.STRING },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
  resolved_by: { type: DataTypes.STRING },
  resolved_at: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT }
});

module.exports = Alert;
