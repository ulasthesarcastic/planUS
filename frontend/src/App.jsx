import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import SenioritiesPage from './components/Seniority/SenioritiesPage';
import PersonnelPage from './components/Personnel/PersonnelPage';
import ProjectsPage from './components/Projects/ProjectsPage';
import PlanningPage from './components/Planning/PlanningPage';
import ProductsPage from './components/Products/ProductsPage';
import './styles/global.css';

export default function App() {
  return (
    <BrowserRouter>
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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
