/**
 * Türkçe kategori isimlerini URL-güvenli slug'a dönüştürür.
 * Örnek: "Ar-Ge Projeleri" → "ar-ge-projeleri"
 */
export function toSlug(name) {
  // Türkçe karakterleri önce değiştir; toLowerCase sonrası İ → 'i\u0307' olur (Node/bazı ortamlar)
  return name
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
