import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_LOG_LINES, getDefaultLogLines, saveDefaultLogLines } from './logViewerSettings';

describe('log viewer settings', () => {
  it('uses 100 lines when no preference is saved', () => {
    expect(getDefaultLogLines({ get: () => null })).toBe(DEFAULT_LOG_LINES);
  });

  it('restores a saved positive safe integer', () => {
    expect(getDefaultLogLines({ get: () => 5000 })).toBe(5000);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '500', true, {}, null])(
    'falls back when the stored preference is invalid: %s',
    (value) => {
      expect(getDefaultLogLines({ get: () => value })).toBe(DEFAULT_LOG_LINES);
    }
  );

  it('falls back when reading storage throws', () => {
    expect(
      getDefaultLogLines({
        get: () => {
          throw new Error('storage unavailable');
        },
      })
    ).toBe(DEFAULT_LOG_LINES);
  });

  it('saves a valid line count', () => {
    const storage = { set: vi.fn() };

    saveDefaultLogLines(storage, 5000);

    expect(storage.set).toHaveBeenCalledWith('docker-log-viewer-default-lines', 5000);
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '500', true, null])('ignores invalid values: %s', (value) => {
    const storage = { set: vi.fn() };

    saveDefaultLogLines(storage, value);

    expect(storage.set).not.toHaveBeenCalled();
  });

  it('does not throw when writing storage fails', () => {
    const storage = {
      set: () => {
        throw new Error('storage unavailable');
      },
    };

    expect(() => saveDefaultLogLines(storage, 5000)).not.toThrow();
  });
});
