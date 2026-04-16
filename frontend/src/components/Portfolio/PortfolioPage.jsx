import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi, projectCategoryApi } from '../../services/api';

function fmt(v) {
  if (v == null || v === 0) return null;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v);
}

function StatRow({ label, value, color }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, color: color || 'var(--text-primary)' }}>
        {value} ₺
      </span>
    </div>
  );
}

export default function PortfolioPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([projectCategoryApi.getAll(), projectApi.getAll()])
      .then(([catRes, projRes]) => {
        const cats = [...(catRes.data || [])].sort((a, b) => a.stepOrder - b.stepOrder);
        setCategories(cats);
        setProjects(projRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 14 }}>
        Yükleniyor...
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.projectStatus !== 'POTANSIYEL');

  return (
    <div style={{ padding: '32px 28px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
        Portföy Yönetimi
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
        Proje kategorilerine göre portföy özeti
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {categories.map(cat => {
          const catProjects = activeProjects.filter(p => p.categoryId === cat.id);
          const totalBudget   = catProjects.reduce((s, p) => s + (p.budget || 0), 0);
          const remainingBudget = catProjects.reduce((s, p) => s + (p.remainingBudget || 0), 0);
          const potentialBudget = catProjects.reduce((s, p) => s + (p.potentialSales || 0), 0);
          const count = catProjects.length;

          return (
            <div
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              style={{
                background: 'var(--bg-secondary)',
                border: `1px solid var(--border)`,
                borderTop: `3px solid ${cat.color || '#6366f1'}`,
                borderRadius: 10,
                padding: '20px 22px',
                cursor: 'pointer',
                transition: 'transform 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: cat.color || '#6366f1', flexShrink: 0
                }} />
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                  {cat.menuLabel || (cat.name + ' Yönetimi')}
                </div>
              </div>

              {/* Project count badge */}
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  display: 'inline-block',
                  background: `${cat.color || '#6366f1'}22`,
                  color: cat.color || '#6366f1',
                  border: `1px solid ${cat.color || '#6366f1'}44`,
                  borderRadius: 6, padding: '3px 10px', fontSize: 13, fontWeight: 600
                }}>
                  {count} proje
                </span>
              </div>

              {/* Budget stats */}
              {count > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <StatRow label="Toplam Bütçe" value={fmt(totalBudget)} color="#34d399" />
                  <StatRow label="Kalan Bütçe"  value={fmt(remainingBudget)} color="#f97316" />
                  <StatRow label="Potansiyel"   value={fmt(potentialBudget)} color="#a78bfa" />
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Henüz proje yok
                </div>
              )}
            </div>
          );
        })}

        {categories.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, padding: 40 }}>
            Henüz kategori tanımlanmamış.
          </div>
        )}
      </div>
    </div>
  );
}
