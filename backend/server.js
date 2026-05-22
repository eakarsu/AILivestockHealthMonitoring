const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { sequelize } = require('./models');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// =====================
// RATE LIMITING
// =====================

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

// Strict rate limit for AI endpoints (expensive OpenRouter calls)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'AI rate limit exceeded. Please wait before running more analyses.' }
});

// Auth rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Apply AI rate limiter to all AI analysis endpoints
app.use('/api/health-records/:id/ai-analysis', aiLimiter);
app.use('/api/disease-detection/ai-predict', aiLimiter);
app.use('/api/feed-management/ai-optimize', aiLimiter);
app.use('/api/breeding-records/:id/ai-recommendation', aiLimiter);
app.use('/api/milk-production/ai-analysis', aiLimiter);
app.use('/api/financial-records/ai-analysis', aiLimiter);
app.use('/api/herds/:id/health-summary', aiLimiter);
app.use('/api/cron/', aiLimiter);
app.use('/api/ai/', aiLimiter);

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
app.use('/api/cron', require('./routes/cron'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/parasite-grazing-rotation', require('./routes/parasiteGrazingRotation'));

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
  } catch (error) { res.status(500).json({ error: 'Failed to retrieve dashboard stats' }); }
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

    // Ensure ai_analyses table exists for AI result persistence
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        animal_id INTEGER,
        user_id INTEGER,
        analysis_type VARCHAR(100),
        input_data JSONB,
        result TEXT,
        urgency_level VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('ai_analyses table ready');

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Custom Livestock Views (mounted before BATCH 05 / 404 boundary)
app.use('/api/custom-views', require('./routes/customViews'));

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/vision-health-monitor', require('./routes/vision-health-monitor'));
app.use('/api/herd-health-advisor', require('./routes/herd-health-advisor'));
app.use('/api/biosecurity-stream', require('./routes/biosecurity-stream'));
app.use('/api/breeding-optimizer', require('./routes/breeding-optimizer'));
app.use('/api/antibiotic-compliance', require('./routes/antibiotic-compliance'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_ai_disease_risk_assessment = require('./routes/gap-ai-disease-risk-assessment'); app.use('/api/gap-ai-disease-risk-assessment', _gap_ai_disease_risk_assessment); } catch(e) { console.error('gap mount fail ai-disease-risk-assessment:', e.message); }
try { const _gap_ai_breeding_advisor = require('./routes/gap-ai-breeding-advisor'); app.use('/api/gap-ai-breeding-advisor', _gap_ai_breeding_advisor); } catch(e) { console.error('gap mount fail ai-breeding-advisor:', e.message); }
try { const _gap_ai_nutrition_optimizer = require('./routes/gap-ai-nutrition-optimizer'); app.use('/api/gap-ai-nutrition-optimizer', _gap_ai_nutrition_optimizer); } catch(e) { console.error('gap mount fail ai-nutrition-optimizer:', e.message); }
try { const _gap_ai_health_anomaly_detector = require('./routes/gap-ai-health-anomaly-detector'); app.use('/api/gap-ai-health-anomaly-detector', _gap_ai_health_anomaly_detector); } catch(e) { console.error('gap mount fail ai-health-anomaly-detector:', e.message); }
try { const _gap_ai_economic_forecaster = require('./routes/gap-ai-economic-forecaster'); app.use('/api/gap-ai-economic-forecaster', _gap_ai_economic_forecaster); } catch(e) { console.error('gap mount fail ai-economic-forecaster:', e.message); }
try { const _gap_iot = require('./routes/gap-iot'); app.use('/api/gap-iot', _gap_iot); } catch(e) { console.error('gap mount fail iot:', e.message); }
try { const _gap_veterinary = require('./routes/gap-veterinary'); app.use('/api/gap-veterinary', _gap_veterinary); } catch(e) { console.error('gap mount fail veterinary:', e.message); }
try { const _gap_compliance = require('./routes/gap-compliance'); app.use('/api/gap-compliance', _gap_compliance); } catch(e) { console.error('gap mount fail compliance:', e.message); }
try { const _gap_mobile = require('./routes/gap-mobile'); app.use('/api/gap-mobile', _gap_mobile); } catch(e) { console.error('gap mount fail mobile:', e.message); }
try { const _gap_milk = require('./routes/gap-milk'); app.use('/api/gap-milk', _gap_milk); } catch(e) { console.error('gap mount fail milk:', e.message); }
try { const _gap_weather_driven = require('./routes/gap-weather-driven'); app.use('/api/gap-weather-driven', _gap_weather_driven); } catch(e) { console.error('gap mount fail weather-driven:', e.message); }
try { const _gap_limited = require('./routes/gap-limited'); app.use('/api/gap-limited', _gap_limited); } catch(e) { console.error('gap mount fail limited:', e.message); }
// === End Batch 05 Mounts ===
