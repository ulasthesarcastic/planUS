import { useState } from 'react';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return setError('Kullanıcı adı ve şifre zorunludur.');
    setError(''); setLoading(true);
    try {
      await login(username, password);
    } catch (e) {
      setError(e.response?.data?.error || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        width: 360, background: 'var(--bg-card)', border: '1px solid var(--border-light)',
        borderRadius: 14, padding: 36, boxShadow: 'var(--shadow)',
      }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4 }}>planUS</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Hesabınıza giriş yapın</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        <div className="form-group">
          <label className="form-label">Kullanıcı Adı</label>
          <input className="form-input" placeholder="kullanici_adi" value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus />
        </div>

        <div className="form-group">
          <label className="form-label">Şifre</label>
          <input className="form-input" type="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '10px' }}>
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </div>
    </div>
  );
}
