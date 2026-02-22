/* eslint-disable no-console */
import { vi } from 'vitest';

/**
 * Suppresses all console output during tests.
 * Useful for tests that trigger expected errors, warnings, or info messages
 * that clutter the test output without providing useful information.
 *
 * Can be used at file level or per-test level.
 *
 * @example File level usage
 * ```typescript
 * import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
 *
 * const restoreConsole = suppressConsoleLogs();
 * afterAll(restoreConsole);
 * ```
 *
 * @example Per-test usage
 * ```typescript
 * import { suppressConsoleLogs } from '@/setup-tests/suppress-console';
 *
 * describe('some test suite', () => {
 *   let restoreConsole: () => void;
 *
 *   beforeEach(() => {
 *     restoreConsole = suppressConsoleLogs();
 *   });
 *
 *   afterEach(() => {
 *     restoreConsole();
 *   });
 *
 *   test('test that produces noisy logs', () => {
 *     // console logs suppressed
 *   });
 * });
 * ```
 *
 * @returns A cleanup function to restore the original console methods
 */
export function suppressConsoleLogs() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalLog = console.log;

  // Suppress all console output
  // Tests expect errors so no need to show them in the output
  console.error = vi.fn();
  console.warn = vi.fn();
  console.info = vi.fn();
  console.log = vi.fn();

  // Return cleanup function to restore original console methods
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
    console.info = originalInfo;
    console.log = originalLog;
  };
}

/* eslint-enable no-console */
