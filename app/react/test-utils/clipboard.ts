/**
 * Stubs isSecureContext and navigator.clipboard for tests that exercise copy
 * functionality. useCopy gates the Clipboard API behind isSecureContext, which
 * is always false in jsdom, so both stubs are needed together.
 *
 * Cleanup is handled automatically by the global afterEach in setup-rtl.ts.
 */
export function mockClipboard() {
  vi.stubGlobal('isSecureContext', true);
  const writeText = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
  return { writeText };
}
