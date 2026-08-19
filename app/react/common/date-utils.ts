/**
 * Format a date to a human-readable string based on the user's locale.
 */
export function localizeDate(date: Date) {
  return date
    .toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .replace('am', 'AM')
    .replace('pm', 'PM');
}
