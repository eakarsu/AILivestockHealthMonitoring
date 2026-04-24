const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinancialRecord = sequelize.define('FinancialRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  description: { type: DataTypes.TEXT },
  animal_id: { type: DataTypes.INTEGER },
  herd_id: { type: DataTypes.INTEGER },
  vendor: { type: DataTypes.STRING },
  invoice_number: { type: DataTypes.STRING },
  payment_method: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'Completed' },
  notes: { type: DataTypes.TEXT }
});

module.exports = FinancialRecord;
