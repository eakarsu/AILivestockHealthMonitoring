import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';

const features = [
  { key: 'animals', title: 'Animal Registry', icon: '🐄', color: '#4F46E5', desc: 'Manage all livestock records' },
  { key: 'health-records', title: 'Health Records', icon: '❤️', color: '#DC2626', desc: 'Track animal health history' },
  { key: 'disease-detection', title: 'Disease Detection', icon: '🔬', color: '#7C3AED', desc: 'AI-powered disease prediction' },
  { key: 'vaccinations', title: 'Vaccination Tracking', icon: '💉', color: '#2563EB', desc: 'Manage vaccination schedules' },
  { key: 'feed-management', title: 'Feed Management', icon: '🌾', color: '#D97706', desc: 'Optimize feed plans with AI' },
  { key: 'weight-tracking', title: 'Weight Tracking', icon: '⚖️', color: '#059669', desc: 'Monitor growth and weight' },
  { key: 'breeding-records', title: 'Breeding Records', icon: '🧬', color: '#EC4899', desc: 'AI breeding recommendations' },
  { key: 'vet-visits', title: 'Veterinary Visits', icon: '👨‍⚕️', color: '#0891B2', desc: 'Track vet appointments' },
  { key: 'medications', title: 'Medication Tracking', icon: '💊', color: '#6366F1', desc: 'Manage prescriptions' },
  { key: 'herds', title: 'Herd Management', icon: '🏘️', color: '#84CC16', desc: 'Organize and manage herds' },
  { key: 'alerts', title: 'Alert System', icon: '🔔', color: '#EF4444', desc: 'Real-time health alerts' },
  { key: 'milk-production', title: 'Milk Production', icon: '🥛', color: '#F59E0B', desc: 'AI production analysis' },
  { key: 'mortality-records', title: 'Mortality Records', icon: '📋', color: '#6B7280', desc: 'Track and prevent losses' },
  { key: 'financial-records', title: 'Financial Reports', icon: '💰', color: '#10B981', desc: 'AI financial analysis' },
];

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => {
    dashboardAPI.getStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div className="dashboard-layout">
      <header className="top-bar">
        <div className="top-bar-left">
          <h1 className="app-title">AI Livestock Health Monitoring</h1>
        </div>
        <div className="top-bar-right">
          <button
            onClick={() => navigate('/custom-views')}
            data-testid="sidebar-livestock-views"
            style={{ background: '#0891b2', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, marginRight: 12 }}
          >
            Livestock Views
          </button>
          <span className="user-name">Welcome, {user?.name}</span>
          <button className="btn-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-number">{stats.totalAnimals || 0}</div>
            <div className="stat-label">Total Animals</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.healthyAnimals || 0}</div>
            <div className="stat-label">Healthy</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalHerds || 0}</div>
            <div className="stat-label">Herds</div>
          </div>
          <div className="stat-card alert-stat">
            <div className="stat-number">{stats.activeAlerts || 0}</div>
            <div className="stat-label">Active Alerts</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{(stats.weeklyMilkProduction || 0).toFixed(0)}L</div>
            <div className="stat-label">Weekly Milk</div>
          </div>
          <div className="stat-card income-stat">
            <div className="stat-number">${(stats.monthlyRevenue || 0).toLocaleString()}</div>
            <div className="stat-label">Monthly Revenue</div>
          </div>
        </div>

        <h2 className="section-title">Management Modules</h2>
        <div className="features-grid">
          {features.map(f => (
            <div key={f.key} className="feature-card" onClick={() => navigate(`/feature/${f.key}`)}
              style={{ '--card-color': f.color }}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="feature-arrow">→</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
