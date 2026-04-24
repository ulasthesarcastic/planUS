/**
 * React dışından (Axios interceptor gibi) toast gösterebilmek için
 * basit bir singleton servis.
 *
 * Kullanım:
 *   import { toastService } from './toastService';
 *   toastService.error('Kayıt silinemedi.');
 *   toastService.success('Proje oluşturuldu.');
 */

let _add = null;

export const toastService = {
  /** Toaster bileşeni tarafından bir kez çağrılır */
  _register(fn) {
    _add = fn;
  },

  success(msg, duration = 3500) {
    _add?.({ type: 'success', msg, duration, id: Date.now() + Math.random() });
  },
  error(msg, duration = 5000) {
    _add?.({ type: 'error', msg, duration, id: Date.now() + Math.random() });
  },
  info(msg, duration = 3500) {
    _add?.({ type: 'info', msg, duration, id: Date.now() + Math.random() });
  },
  warning(msg, duration = 4000) {
    _add?.({ type: 'warning', msg, duration, id: Date.now() + Math.random() });
  },
};
