/**
 * INN (ИНН) validator for Russian Federation.
 * Supports 10-digit (legal entities) and 12-digit (individuals/sole proprietors).
 */
export const validateInn = (inn: string | number): { isValid: boolean; error?: string } => {
  const sInn = inn.toString().trim();

  if (!/^\d+$/.test(sInn)) {
    return { isValid: false, error: 'ИНН должен содержать только цифры' };
  }

  if (sInn.length !== 10 && sInn.length !== 12) {
    return { isValid: false, error: 'ИНН должен содержать 10 или 12 цифр' };
  }

  const checkDigit = (digits: string, coefficients: number[]): number => {
    let n = 0;
    for (let i = 0; i < coefficients.length; i++) {
      n += coefficients[i] * parseInt(digits[i]);
    }
    return (n % 11) % 10;
  };

  if (sInn.length === 10) {
    const coefficients = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    if (checkDigit(sInn, coefficients) !== parseInt(sInn[9])) {
      return { isValid: false, error: 'Неверное контрольное число ИНН (ЮЛ)' };
    }
  }

  if (sInn.length === 12) {
    const c1 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const c2 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    if (checkDigit(sInn, c1) !== parseInt(sInn[10]) || checkDigit(sInn, c2) !== parseInt(sInn[11])) {
      return { isValid: false, error: 'Неверное контрольное число ИНН (ИП)' };
    }
  }

  return { isValid: true };
};
