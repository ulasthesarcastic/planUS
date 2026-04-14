export default function PotansiyelSiparislerPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Potansiyel Siparişler</div>
          <div className="page-subtitle">Ürün ve hizmet siparişlerini takip edin</div>
        </div>
      </div>
      <div className="empty-state">
        <p>Bu bölüm yakında aktif olacak.</p>
        <p style={{ fontSize: 12, marginTop: 8, color: 'var(--text-muted)' }}>
          Ürün ve hizmet projelerine bağlı siparişler burada takip edilecek.
        </p>
      </div>
    </div>
  );
}
