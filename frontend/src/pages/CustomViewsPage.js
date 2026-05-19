import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import AnimalVitalsTrendChart from '../components/AnimalVitalsTrendChart';
import HerdHealthHeatmap from '../components/HerdHealthHeatmap';
import VetReportPDF from '../components/VetReportPDF';
import HealthRulesEditor from '../components/HealthRulesEditor';

export default function CustomViewsPage({ user, onLogout }) {
  const navigate = useNavigate();

  return (
    <div data-testid="custom-views-page" style={st.layout}>
      <header style={st.topBar}>
        <div style={st.topLeft}>
          <button onClick={() => navigate('/')} style={st.btnBack}>← Dashboard</button>
          <h1 style={st.appTitle}>Livestock Views</h1>
        </div>
        <div style={st.topRight}>
          {user?.name && <span style={st.userName}>Welcome, {user.name}</span>}
          {onLogout && <button onClick={onLogout} style={st.btnLogout}>Logout</button>}
        </div>
      </header>

      <div style={st.body}>
        <aside style={st.sidebar} data-testid="livestock-views-sidebar">
          <div style={st.sidebarBrand}>LIVESTOCK</div>
          <div style={st.sidebarGroupLabel}>Navigation</div>
          <NavLink to="/" end style={({ isActive }) => ({ ...st.navLink, ...(isActive ? st.navLinkActive : {}) })}>
            Dashboard
          </NavLink>
          <NavLink to="/ai-tools" style={({ isActive }) => ({ ...st.navLink, ...(isActive ? st.navLinkActive : {}) })}>
            AI Tools
          </NavLink>

          <div style={st.sidebarGroupLabel}>Analytics</div>
          <NavLink to="/custom-views" style={({ isActive }) => ({ ...st.navLink, ...(isActive ? st.navLinkActive : {}) })} data-testid="sidebar-livestock-views-link">
            Livestock Views
          </NavLink>
        </aside>

        <main style={st.main}>
          <div style={st.intro}>
            <h2 style={st.h2}>Custom Livestock Health Views</h2>
            <p style={st.lead}>
              Four cross-cutting views over animals, health records, vet visits, and herd metadata —
              vitals trends, herd-wide heatmap, printable vet reports, and editable rule thresholds.
            </p>
          </div>

          <div style={st.grid}>
            <AnimalVitalsTrendChart />
            <HerdHealthHeatmap />
          </div>

          <div style={{ ...st.grid, marginTop: 18 }}>
            <VetReportPDF />
            <HealthRulesEditor />
          </div>
        </main>
      </div>
    </div>
  );
}

const st = {
  layout: { minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: '#0f172a', color: '#fff' },
  topLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  topRight: { display: 'flex', alignItems: 'center', gap: 12 },
  appTitle: { margin: 0, fontSize: 18, fontWeight: 600 },
  userName: { fontSize: 13, color: '#cbd5e1' },
  btnBack: { background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  btnLogout: { background: '#dc2626', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  body: { display: 'flex', flex: 1, minHeight: 0 },
  sidebar: { width: 220, background: '#1e293b', color: '#cbd5e1', padding: '18px 0', flexShrink: 0 },
  sidebarBrand: { padding: '0 18px 14px', fontWeight: 700, fontSize: 14, letterSpacing: 1.5, color: '#fff', borderBottom: '1px solid #334155' },
  sidebarGroupLabel: { padding: '14px 18px 6px', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 },
  navLink: { display: 'block', padding: '8px 18px', color: '#cbd5e1', textDecoration: 'none', fontSize: 13, borderLeft: '3px solid transparent' },
  navLinkActive: { background: '#0f172a', color: '#fff', borderLeftColor: '#0891b2' },
  main: { flex: 1, padding: 24, overflowY: 'auto' },
  intro: { marginBottom: 18 },
  h2: { margin: '0 0 6px', color: '#0f172a' },
  lead: { margin: 0, color: '#64748b', fontSize: 13 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))', gap: 18 },
};
