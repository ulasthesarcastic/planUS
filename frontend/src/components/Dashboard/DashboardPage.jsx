import { useNavigate } from 'react-router-dom';
import { useProjects, useCategories } from '../../hooks/useQueries';
import { toSlug } from '../Sidebar';

function fmt(v) {
  if (!v) return null;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: categoriesRaw = [], isLoading: catsLoading } = useCategories();
  const { data: projects = [], isLoading: projsLoading } = useProjects();
  const categories = [...categoriesRaw].sort((a, b) => a.stepOrder - b.stepOrder);
  const loading = catsLoading || projsLoading;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--text-muted)', fontSize: 14 }}>
      Yükleniyor...
    </div>
  );

  const activeProjects = projects.filter(p => p.projectStatus !== 'POTANSIYEL');

  return (
    <div style={{ padding: '32px 28px' }}>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Portföy özeti</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginTop: 24 }}>
        {categories.map(cat => {
          const catProjects = activeProjects.filter(p => p.categoryId === cat.id);
          const totalBudget     = catProjects.reduce((s, p) => s + (p.budget || 0), 0);
          const remainingBudget = catProjects.reduce((s, p) => s + (p.remainingBudget || 0), 0);
          const potentialBudget = catProjects.reduce((s, p) => s + (p.potentialSales || 0), 0);

          return (
            <div
              key={cat.id}
              onClick={() => navigate(`/category/${toSlug(cat.name)}`)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderTop: `3px solid ${cat.color || '#6366f1'}`,
                borderRadius: 10,
                padding: '20px 22px',
                cursor: 'pointer',
                transition: 'transform 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color || '#6366f1' }} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                    {cat.menuLabel || cat.name + ' Yönetimi'}
                  </span>
                </div>
                <span style={{
                  background: `${cat.color || '#6366f1'}22`,
                  color: cat.color || '#6366f1',
                  border: `1px solid ${cat.color || '#6366f1'}44`,
                  borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600
                }}>
                  {catProjects.length} proje
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Toplam Bütçe</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, color: 'var(--text-secondary)' }}>{fmt(totalBudget) ?? '0'} ₺</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Kalan Bütçe</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, color: 'var(--text-secondary)' }}>{fmt(remainingBudget) ?? '0'} ₺</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Potansiyel</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 500, color: 'var(--text-secondary)' }}>{fmt(potentialBudget) ?? '0'} ₺</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
