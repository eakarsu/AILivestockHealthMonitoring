const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sequelize } = require('./models');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/animals', require('./routes/animals'));
app.use('/api/health-records', require('./routes/healthRecords'));
app.use('/api/vaccinations', require('./routes/vaccinations'));
app.use('/api/feed-management', require('./routes/feedManagement'));
app.use('/api/weight-tracking', require('./routes/weightTracking'));
app.use('/api/breeding-records', require('./routes/breedingRecords'));
app.use('/api/vet-visits', require('./routes/vetVisits'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/herds', require('./routes/herds'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/disease-detection', require('./routes/diseaseDetection'));
app.use('/api/mortality-records', require('./routes/mortalityRecords'));
app.use('/api/milk-production', require('./routes/milkProduction'));
app.use('/api/financial-records', require('./routes/financialRecords'));

// Dashboard stats
const auth = require('./middleware/auth');
const { Animal, HealthRecord, Alert, Herd, MilkProduction, FinancialRecord } = require('./models');
const { Op } = require('sequelize');

app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    const totalAnimals = await Animal.count();
    const activeAlerts = await Alert.count({ where: { is_resolved: false } });
    const totalHerds = await Herd.count();
    const healthyAnimals = await Animal.count({ where: { status: 'Active' } });
    const recentMilk = await MilkProduction.sum('quantity_liters', {
      where: { production_date: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    });
    const monthlyRevenue = await FinancialRecord.sum('amount', {
      where: { type: 'Income', date: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });
    const monthlyExpenses = await FinancialRecord.sum('amount', {
      where: { type: 'Expense', date: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
    });

    res.json({
      totalAnimals,
      activeAlerts: activeAlerts || 0,
      totalHerds,
      healthyAnimals,
      weeklyMilkProduction: recentMilk || 0,
      monthlyRevenue: monthlyRevenue || 0,
      monthlyExpenses: monthlyExpenses || 0
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    await sequelize.sync({ alter: true });
    console.log('Database synced');
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
