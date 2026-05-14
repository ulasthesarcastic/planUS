import { useState, useEffect, useCallback } from 'react';
import { activityLogApi } from '../../services/api';

const ENTITY_LABELS = {
  POTANSIYEL_PROJE:   'Potansiyel Proje',
  POTANSIYEL_SIPARIS: 'Potansiyel Sipariş',
  PROJE:              'Proje',
  PERSONEL:           'Personel',
};

const ACTION_LABELS = {
  AUTO_SHIFT:    'Otomatik Kaydırma',
  STATUS_CHANGE: 'Durum Değişikliği',
  CREATE:        'Oluşturuldu',
  UPDATE:        'Güncellendi',
  DELETE:        'Silindi',
};

const ACTION_COLORS = {
  AUTO_SHIFT:    '#f59e0b',
  STATUS_CHANGE: '#60a5fa',
  CREATE:        '#22c55e',
  UPDATE:        '#a78bfa',
  DELETE:        '#f87171',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ActivityLogPage() {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(false);
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activityLogApi.getAll(page, PAGE_SIZE, entityFilter || undefined);
      setLogs(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (_) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (val) => {
    setEntityFilter(val);
    setPage(0);
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="page-title" style={{ marginBottom: 20 }}>Aktivite Geçmişi</div>

      {/* Filtre */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'POTANSIYEL_PROJE', 'POTANSIYEL_SIPARIS', 'PROJE', 'PERSONEL'].map(key => (
          <button
            key={key}
            className={`btn ${entityFilter === key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: 13 }}
            onClick={() => handleFilterChange(key)}
          >
            {key === '' ? 'Tümü' : (ENTITY_LABELS[key] || key)}
          </button>
        ))}
      </div>

      {/* Tablo */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 32 }}>Yükleniyor…</div>
      ) : logs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: 32 }}>Kayıt bulunamadı.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Tarih', 'Tür', 'Ad', 'İşlem', 'Kim', 'Detay'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px',
                    color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    {ENTITY_LABELS[log.entityType] || log.entityType}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 500 }}>
                    {log.entityName || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      background: (ACTION_COLORS[log.action] || '#6b7280') + '22',
                      color:      ACTION_COLORS[log.action] || '#6b7280',
                      borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600,
                    }}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                    {log.actor || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                    {log.detail || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <button className="btn btn-ghost" disabled={page === 0}
            onClick={() => setPage(p => p - 1)}>← Önceki</button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {page + 1} / {totalPages}
          </span>
          <button className="btn btn-ghost" disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}>Sonraki →</button>
        </div>
      )}
    </div>
  );
}
