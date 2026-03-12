/**
 * Converts a numeric amount to Russian text representation (rubles and kopecks).
 * Example: 1250.50 => "Одна тысяча двести пятьдесят рублей 50 копеек"
 */
export const moneyToWordsRu = (amount: number): string => {
  const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

  const scales = [
    { unit: ['миллиард', 'миллиарда', 'миллиардов'], gender: 'm' },
    { unit: ['миллион', 'миллиона', 'миллионов'], gender: 'm' },
    { unit: ['тысяча', 'тысячи', 'тысяч'], gender: 'f' },
    { unit: ['рубль', 'рубля', 'рублей'], gender: 'm' }
  ];

  const pluralize = (n: number, forms: string[]) => {
    const last2 = n % 100;
    const last1 = n % 10;
    if (last2 > 10 && last2 < 20) return forms[2];
    if (last1 === 1) return forms[0];
    if (last1 > 1 && last1 < 5) return forms[1];
    return forms[2];
  };

  const transformSegment = (n: number, gender: string): string => {
    let res = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) res += hundreds[h] + ' ';
    if (t === 1) {
      res += teens[u] + ' ';
    } else {
      if (t > 1) res += tens[t] + ' ';
      if (u > 0) {
        if (gender === 'f') {
          const femaleUnits: Record<number, string> = { 1: 'одна', 2: 'две' };
          res += (femaleUnits[u] || units[u]) + ' ';
        } else {
          res += units[u] + ' ';
        }
      }
    }
    return res;
  };

  const rub = Math.floor(amount);
  const kop = Math.round((amount - rub) * 100);

  let result = '';
  let remaining = rub;

  if (rub === 0) result = 'ноль рублей ';

  for (let i = 0; i < scales.length; i++) {
    const divisor = Math.pow(1000, 3 - i);
    const currentSegment = Math.floor(remaining / divisor);

    if (currentSegment > 0 || (i === 3 && result === '')) {
      if (currentSegment > 0) {
        result += transformSegment(currentSegment, scales[i].gender);
        result += pluralize(currentSegment, scales[i].unit) + ' ';
      } else if (i === 3 && result === '') {
        result += 'ноль ' + pluralize(0, scales[i].unit) + ' ';
      }
    }
    remaining %= divisor;
  }

  const kopString = kop.toString().padStart(2, '0');
  const kopPlural = pluralize(kop, ['копейка', 'копейки', 'копеек']);

  result += `${kopString} ${kopPlural}`;

  return result.charAt(0).toUpperCase() + result.slice(1).trim();
};
