const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Animal = sequelize.define('Animal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  tag_id: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  species: { type: DataTypes.STRING, allowNull: false },
  breed: { type: DataTypes.STRING },
  date_of_birth: { type: DataTypes.DATEONLY },
  gender: { type: DataTypes.STRING },
  weight: { type: DataTypes.FLOAT },
  color: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Active' },
  purchase_date: { type: DataTypes.DATEONLY },
  purchase_price: { type: DataTypes.FLOAT },
  herd_id: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT }
});

module.exports = Animal;
