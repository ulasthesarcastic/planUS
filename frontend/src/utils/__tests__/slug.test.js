import { toSlug } from '../slug';

describe('toSlug', () => {
  test('küçük harf ASCII harfler değişmez', () => {
    expect(toSlug('proje')).toBe('proje');
  });

  test('büyük harfleri küçülter', () => {
    expect(toSlug('PROJE')).toBe('proje');
  });

  test('Türkçe karakterleri dönüştürür', () => {
    expect(toSlug('ışğüöçİŞĞÜÖÇ')).toBe('isguocisguoc');
    // tek tek doğrula
    expect(toSlug('ı')).toBe('i');
    expect(toSlug('İ')).toBe('i');
    expect(toSlug('ş')).toBe('s');
    expect(toSlug('Ş')).toBe('s');
    expect(toSlug('ğ')).toBe('g');
    expect(toSlug('Ğ')).toBe('g');
    expect(toSlug('ü')).toBe('u');
    expect(toSlug('Ü')).toBe('u');
    expect(toSlug('ö')).toBe('o');
    expect(toSlug('Ö')).toBe('o');
    expect(toSlug('ç')).toBe('c');
    expect(toSlug('Ç')).toBe('c');
  });

  test('boşlukları tire ile değiştirir', () => {
    expect(toSlug('Ar-Ge Projeleri')).toBe('ar-ge-projeleri');
  });

  test('ardışık boşluk/özel karakter tek tire olur', () => {
    expect(toSlug('proje  yönetimi')).toBe('proje-yonetimi');
    expect(toSlug('proje & yönetim')).toBe('proje-yonetim');
  });

  test('baştaki ve sondaki tire kaldırılır', () => {
    expect(toSlug(' proje ')).toBe('proje');
    expect(toSlug('-proje-')).toBe('proje');
  });

  test('gerçek kategori isimleri doğru slug üretir', () => {
    expect(toSlug('Yazılım Geliştirme')).toBe('yazilim-gelistirme');
    expect(toSlug('Ar-Ge & İnovasyon')).toBe('ar-ge-inovasyon');
    expect(toSlug('Müşteri Projeleri')).toBe('musteri-projeleri');
    expect(toSlug('Altyapı / Sistem')).toBe('altyapi-sistem');
  });

  test('rakamlar korunur', () => {
    expect(toSlug('Faz 2')).toBe('faz-2');
    expect(toSlug('2024 Projeleri')).toBe('2024-projeleri');
  });
});
