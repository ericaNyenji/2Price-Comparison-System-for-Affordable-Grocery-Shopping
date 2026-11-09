import { formatCurrency } from './currency';

beforeEach(() => {
  sessionStorage.clear();
});

test('returns 0.00 for null or non-numeric amounts', () => {
  expect(formatCurrency(null)).toBe('0.00');
  expect(formatCurrency('not-a-number')).toBe('0.00');
});

test('falls back to a plain currency-code format for unsupported codes', () => {
  sessionStorage.setItem('currencyCode', 'NOT_A_CODE');
  expect(formatCurrency(12)).toBe('NOT_A_CODE 12.00');
});
