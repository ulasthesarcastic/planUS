import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { activityLogApi } from '../services/api';
import { toastService } from '../services/toastService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => { localStorage.removeItem('token'); delete axios.defaults.headers.common['Authorization']; })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);

    // Login sonrası geçmiş kalan potansiyelleri kaydır
    try {
      const shiftRes = await activityLogApi.shiftOverdue();
      const { shiftedProjects = [], shiftedSales = [] } = shiftRes.data;
      const total = shiftedProjects.length + shiftedSales.length;
      if (total > 0) {
        const names = [...shiftedProjects, ...shiftedSales].map(s => s.name).join(', ');
        toastService.warning(`${total} potansiyel ileriye kaydırıldı: ${names}`);
      }
    } catch (_) { /* sessizce geç */ }

    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
