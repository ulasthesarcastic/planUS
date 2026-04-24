export const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
                       'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

/** Verilen ay/yıl'a offset ay ekler */
export const addMonths = (month, year, offset) => {
  const total = (year * 12 + month - 1) + offset;
  return { month: (total % 12) + 1, year: Math.floor(total / 12) };
};

/** Kaynak planı girdilerini kaydırır ve yeni bitiş tarihinin dışındakileri atar */
export const applyShift = (entries, offset, newEndMonth, newEndYear) => {
  const endTotal = newEndYear * 12 + newEndMonth;
  return entries
    .map(e => { const { month, year } = addMonths(e.month, e.year, offset); return { ...e, month, year }; })
    .filter(e => (e.year * 12 + e.month) <= endTotal);
};

/**
 * Potansiyel proje başlangıç/bitiş tarihi değişince kaydırma bilgisi hesaplar.
 * Değişiklik yoksa null döndürür.
 *
 * @returns {{ offset: number, dropped: number, droppedMonths: string[] } | null}
 */
export const buildShiftInfo = (entries, oldSM, oldSY, newSM, newSY, newEM, newEY) => {
  if (!entries || entries.length === 0) return null;
  const offset   = (newSY * 12 + newSM) - (oldSY * 12 + oldSM);
  const endTotal = newEY * 12 + newEM;
  const shifted  = entries.map(e => { const { month, year } = addMonths(e.month, e.year, offset); return { ...e, month, year }; });
  const dropped  = shifted.filter(e => (e.year * 12 + e.month) > endTotal);
  const droppedMonths = [...new Set(dropped.map(e => `${MONTHS[e.month - 1]} ${e.year}`))];
  if (offset === 0 && dropped.length === 0) return null;
  return { offset, dropped: dropped.length, droppedMonths };
};
