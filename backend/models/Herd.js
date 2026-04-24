const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Herd = sequelize.define('Herd', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  herd_type: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },
  capacity: { type: DataTypes.INTEGER },
  current_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  manager: { type: DataTypes.STRING },
  established_date: { type: DataTypes.DATEONLY },
  purpose: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  notes: { type: DataTypes.TEXT }
});

module.exports = Herd;
