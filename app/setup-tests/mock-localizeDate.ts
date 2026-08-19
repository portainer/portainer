// Mock localizeDate to always use en-US and UTC
vi.mock('@/react/common/date-utils', () => ({
  localizeDate: (date: Date) =>
    date
      .toLocaleString('en-US', {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .replace('am', 'AM')
      .replace('pm', 'PM'),
}));

/** @deprecated vi.mock calls are hoisted; callers no longer need to invoke this */
export function mockLocalizeDate() {}
