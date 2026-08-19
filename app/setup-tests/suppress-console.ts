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
  // Use vi.spyOn so the mocks integrate with vitest's mock system
  // (compatible with vitest-fail-on-console and vi.restoreAllMocks)
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  return () => {
    errorSpy.mockRestore();
    warnSpy.mockRestore();
    infoSpy.mockRestore();
    logSpy.mockRestore();
  };
}
