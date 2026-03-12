/**
 * INN (ИНН) validator for Russian Federation.
 * Re-exports from src/utils/validateInn for canonical path.
 */
export { validateInn } from '@/utils/validateInn';

/** Basic email format check */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Phone: +7XXXXXXXXXX or 8XXXXXXXXXX */
export const isValidRussianPhone = (phone: string): boolean =>
  /^(\+7|8)\d{10}$/.test(phone.replace(/[\s\-()]/g, ''));
