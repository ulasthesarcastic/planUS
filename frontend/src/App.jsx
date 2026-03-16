import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './auth/LoginPage';
import Sidebar from './components/Sidebar';
import SenioritiesPage from './components/Seniority/SenioritiesPage';
import PersonnelPage from './components/Personnel/PersonnelPage';
import ProjectsPage from './components/Projects/ProjectsPage';
import PlanningPage from './components/Planning/PlanningPage';
import ProductsPage from './components/Products/ProductsPage';
import OrganizationPage from './components/Organization/OrganizationPage';
import SalesPage from './components/Sales/SalesPage';
import BudgetPage from './components/Budget/BudgetPage';
import './styles/global.css';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', color: 'var(--text-muted)', fontSize: 14 }}>
      Yükleniyor...
    </div>
  );

  if (!user) return <LoginPage />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/seniorities" element={<SenioritiesPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/organization" element={<OrganizationPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/budget" element={<BudgetPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
