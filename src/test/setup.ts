import '@testing-library/jest-dom';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

if (!(globalThis as any).crypto) {
  (globalThis as any).crypto = { randomUUID: () => Math.random().toString(36).slice(2) };
} else if (!(globalThis as any).crypto.randomUUID) {
  (globalThis as any).crypto.randomUUID = () => Math.random().toString(36).slice(2);
}