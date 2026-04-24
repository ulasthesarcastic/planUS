import { addMonths, applyShift, buildShiftInfo } from '../salesUtils';

// ── addMonths ────────────────────────────────────────────────────────────────

describe('addMonths', () => {
  test('aynı yıl içinde ay ekler', () => {
    expect(addMonths(1, 2025, 3)).toEqual({ month: 4, year: 2025 });
  });

  test('yıl sınırını aşınca yılı artırır', () => {
    expect(addMonths(11, 2025, 3)).toEqual({ month: 2, year: 2026 });
  });

  test('yılbaşından geçiş: Aralık + 1 ay', () => {
    expect(addMonths(12, 2025, 1)).toEqual({ month: 1, year: 2026 });
  });

  test('negatif offset: geriye kaydırma', () => {
    expect(addMonths(3, 2025, -2)).toEqual({ month: 1, year: 2025 });
    expect(addMonths(1, 2025, -1)).toEqual({ month: 12, year: 2024 });
  });

  test('sıfır offset: değişmez', () => {
    expect(addMonths(6, 2025, 0)).toEqual({ month: 6, year: 2025 });
  });
});

// ── applyShift ────────────────────────────────────────────────────────────────

describe('applyShift', () => {
  const entry = (month, year) => ({ month, year, need: 1 });

  test('offset 0, tüm girdiler aralık içinde: değişmez', () => {
    const entries = [entry(3, 2025), entry(4, 2025)];
    const result = applyShift(entries, 0, 6, 2025);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ month: 3, year: 2025 });
  });

  test('offset 2: tüm girdiler 2 ay ileri kayar', () => {
    const entries = [entry(1, 2025), entry(2, 2025)];
    const result = applyShift(entries, 2, 12, 2025);
    expect(result[0]).toMatchObject({ month: 3, year: 2025 });
    expect(result[1]).toMatchObject({ month: 4, year: 2025 });
  });

  test('yeni bitiş tarihinin dışına çıkan girdiler atılır', () => {
    const entries = [entry(1, 2025), entry(6, 2025), entry(12, 2025)];
    const result = applyShift(entries, 0, 6, 2025); // bitiş = Haz 2025
    expect(result).toHaveLength(2);
    expect(result.find(e => e.month === 12)).toBeUndefined();
  });

  test('boş dizi boş döner', () => {
    expect(applyShift([], 3, 6, 2025)).toEqual([]);
  });
});

// ── buildShiftInfo ─────────────────────────────────────────────────────────────

describe('buildShiftInfo', () => {
  const entry = (month, year) => ({ month, year, need: 1 });

  test('giriş boş ise null döner', () => {
    expect(buildShiftInfo([], 1, 2025, 1, 2025, 12, 2025)).toBeNull();
    expect(buildShiftInfo(null, 1, 2025, 1, 2025, 12, 2025)).toBeNull();
  });

  test('offset 0, kayıp yok: null döner', () => {
    const entries = [entry(3, 2025), entry(4, 2025)];
    // başlangıç ve bitiş değişmedi
    expect(buildShiftInfo(entries, 1, 2025, 1, 2025, 12, 2025)).toBeNull();
  });

  test('başlangıç ileri kaydırılınca offset hesaplanır', () => {
    const entries = [entry(1, 2025), entry(2, 2025)];
    // eski başlangıç: Oca 2025, yeni başlangıç: Mar 2025 → offset = +2
    const info = buildShiftInfo(entries, 1, 2025, 3, 2025, 12, 2025);
    expect(info).not.toBeNull();
    expect(info.offset).toBe(2);
    expect(info.dropped).toBe(0);
  });

  test('bitiş kısaltılınca aralık dışı girdiler dropped olarak raporlanır', () => {
    const entries = [entry(1, 2025), entry(6, 2025), entry(12, 2025)];
    // offset 0 ama bitiş Mar 2025'e çekildi
    const info = buildShiftInfo(entries, 1, 2025, 1, 2025, 3, 2025);
    expect(info).not.toBeNull();
    expect(info.offset).toBe(0);
    expect(info.dropped).toBe(2); // Haz ve Ara düşer
  });

  test('hem kaydırma hem kısaltma varsa ikisi birden raporlanır', () => {
    const entries = [entry(1, 2025), entry(6, 2025), entry(12, 2025)];
    // başlangıç +2 ay, bitiş = Eki 2025
    const info = buildShiftInfo(entries, 1, 2025, 3, 2025, 10, 2025);
    expect(info.offset).toBe(2);
    expect(info.dropped).toBe(1); // Ara 2025 → Şub 2026 (bitiş dışında)
  });

  test('droppedMonths benzersiz ay etiketleri içerir', () => {
    const entries = [entry(11, 2025), entry(12, 2025), entry(12, 2025)]; // Ara iki kez
    const info = buildShiftInfo(entries, 1, 2025, 1, 2025, 10, 2025);
    // Ara 2025 bir kez görünmeli
    const araCount = info.droppedMonths.filter(m => m === 'Aralık 2025').length;
    expect(araCount).toBe(1);
  });

  test('başlangıç geri alındığında (negatif offset) null değil sonuç döner', () => {
    const entries = [entry(3, 2025)];
    // başlangıç 3. aydan 1. aya çekildi → offset = -2
    const info = buildShiftInfo(entries, 3, 2025, 1, 2025, 12, 2025);
    expect(info).not.toBeNull();
    expect(info.offset).toBe(-2);
  });
});
