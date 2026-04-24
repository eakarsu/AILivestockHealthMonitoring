const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FeedManagement = sequelize.define('FeedManagement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  animal_id: { type: DataTypes.INTEGER },
  herd_id: { type: DataTypes.INTEGER },
  feed_type: { type: DataTypes.STRING, allowNull: false },
  brand: { type: DataTypes.STRING },
  quantity_kg: { type: DataTypes.FLOAT },
  feeding_date: { type: DataTypes.DATEONLY, allowNull: false },
  feeding_time: { type: DataTypes.STRING },
  cost_per_kg: { type: DataTypes.FLOAT },
  total_cost: { type: DataTypes.FLOAT },
  nutritional_info: { type: DataTypes.TEXT },
  supplier: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  notes: { type: DataTypes.TEXT }
});

module.exports = FeedManagement;
