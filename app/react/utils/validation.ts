import { string } from 'yup';

/**
 * Validates a duration string format (e.g., "5m0s", "10m", "1h30m")
 *
 * Valid units:
 * - ns (nanoseconds)
 * - us/µs (microseconds)
 * - ms (milliseconds)
 * - s (seconds)
 * - m (minutes)
 * - h (hours)
 * - d (days)
 *
 * Examples of valid durations:
 * - "300s"
 * - "5m"
 * - "1h30m"
 * - "2h45m30s"
 * - "1.5h"
 * - "7d"
 * - "2d12h"
 *
 * @param allowEmpty - Whether to allow empty strings (default: true)
 * @returns Yup string schema with duration validation
 */
export function durationValidation(allowEmpty = true) {
  // Regex pattern that matches duration format
  // Allows: number (with optional decimal) + unit, can be chained
  // Units: ns, us, µs, ms, s, m, h, d
  const durationRegex = /^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h|d))+$/;

  return string().test(
    'duration',
    'Invalid duration format. Use formats like 5m, 1h30m, 7d, or 300s',
    (value) => {
      // Empty string is valid if allowed
      if (allowEmpty && (!value || value.trim() === '')) {
        return true;
      }

      // Empty string is invalid if not allowed
      if (!allowEmpty && (!value || value.trim() === '')) {
        return false;
      }

      // Check if the format matches duration pattern
      return value ? durationRegex.test(value.trim()) : false;
    }
  );
}
