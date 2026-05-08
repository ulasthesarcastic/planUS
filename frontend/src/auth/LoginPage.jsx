import { useState } from 'react';
import { useAuth } from './AuthContext';

// Pusula Gülü SVG (currentColor — renk prop ile kontrol edilir)
function PusulaLogo({ size = 40, color = '#22D3EE' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      width={size}
      height={size}
      style={{ color, flexShrink: 0 }}
    >
      <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="1" opacity="0.25" />
      <path d="M50 8 L54 50 L50 92 L46 50 Z" fill="currentColor" />
      <path d="M8 50 L50 46 L92 50 L50 54 Z" fill="currentColor" opacity="0.55" />
      <path d="M22 22 L48 48 L50 50 L48 52 L22 78 L24 50 Z" fill="currentColor" opacity="0.18" />
      <circle cx="50" cy="50" r="3" fill="#0F0E13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

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
      minHeight: '100vh',
      display: 'flex',
      background: '#0F0E13',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {/* ── Sol panel: Marka ── */}
      <div style={{
        flex: '1 1 0',
        minWidth: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '36px 48px',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0d1f2d 0%, #0F0E13 55%, #120d1a 100%)',
      }}>
        {/* Radyal ışıma */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 20% 60%, rgba(34,211,238,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(139,92,246,0.06) 0%, transparent 60%)',
        }} />

        {/* Logo + Marka adı */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <PusulaLogo size={42} color="#22D3EE" />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ECE7EC', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              Pusula
            </div>
            <div style={{ fontSize: 12, color: '#6B7A8E', letterSpacing: '0.3px', marginTop: 2 }}>
              Decide before it happens
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative' }}>
          <p style={{
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 700,
            color: '#ECE7EC',
            lineHeight: 1.3,
            margin: 0,
            maxWidth: 480,
          }}>
            Portföyünüzü{' '}
            <span style={{ color: '#22D3EE' }}>Pusula</span>
            {' '}ile yönetin.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <span style={{ fontSize: 12, color: '#3a4251', fontFamily: 'DM Mono, monospace' }}>v2.0.0</span>
          <span style={{ fontSize: 12, color: '#3a4251' }}>·</span>
          <span style={{ fontSize: 12, color: '#3a4251' }}>© 2026 BİLGEM</span>
        </div>
      </div>

      {/* ── Sağ panel: Form ── */}
      <div style={{
        width: 'clamp(380px, 38%, 500px)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#16141C',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: '#ECE7EC',
            marginBottom: 32,
            letterSpacing: '-0.4px',
          }}>
            Giriş yap
          </h1>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10,
              padding: '10px 14px',
              color: '#f87171',
              fontSize: 13,
              marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          {/* Kullanıcı Adı */}
          <div style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: '#6B7A8E',
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8,
            }}>
              Kullanıcı Adı
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#1E1C26', border: '1px solid #2a2735',
              borderRadius: 10, padding: '0 14px', height: 48,
              transition: 'border-color 0.15s',
            }}>
              <span style={{ color: '#4B5563', flexShrink: 0 }}><PersonIcon /></span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="kullanici_adi"
                autoFocus
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#ECE7EC', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>
          </div>

          {/* Şifre */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: '#6B7A8E',
              textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8,
            }}>
              Şifre
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#1E1C26',
              border: `1px solid ${pwFocused ? '#22D3EE' : '#2a2735'}`,
              borderRadius: 10, padding: '0 14px', height: 48,
              transition: 'border-color 0.15s',
              boxShadow: pwFocused ? '0 0 0 3px rgba(34,211,238,0.1)' : 'none',
            }}>
              <span style={{ color: pwFocused ? '#22D3EE' : '#4B5563', flexShrink: 0, transition: 'color 0.15s' }}>
                <LockIcon />
              </span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                onFocus={() => setPwFocused(true)}
                onBlur={() => setPwFocused(false)}
                placeholder="••••••••"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: '#ECE7EC', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>
          </div>

          {/* Remember me */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            cursor: 'pointer', marginBottom: 28, userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              style={{ accentColor: '#22D3EE', width: 15, height: 15, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 13, color: '#6B7A8E' }}>Beni hatırla</span>
          </label>

          {/* Giriş Yap butonu */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', height: 50,
              background: loading ? '#17a8c0' : '#22D3EE',
              color: '#0F0E13',
              border: 'none', borderRadius: 10,
              fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.2px',
              transition: 'background 0.15s, opacity 0.15s',
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#06b6d4'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#22D3EE'; }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  );
}
