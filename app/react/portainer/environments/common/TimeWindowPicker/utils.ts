import moment from 'moment';

/**
 * Converts a UTC time to the same format in the given timezone.
 * @param utcTime The UTC time to convert in 'HH:mm' format.
 * @param timeZone The timezone to convert the UTC time to.
 * @param format The format to convert the time to.
 * @returns The converted time in the same format as the input.
 */
export function utcToTimeZone(
  utcTime: string,
  timeZone: string,
  format = 'HH:mm'
) {
  return moment.utc(utcTime, 'HH:mm').tz(timeZone).format(format);
}

/**
 * Converts a time in the given timezone to the same format in UTC.
 * @param time The time to convert in 'HH:mm' format.
 * @param timeZone The timezone to convert the time to UTC.
 * @returns The converted time in the same format as the input.
 */
export function timeZoneToUtc(time: string, timeZone: string) {
  return moment.tz(time, 'HH:mm', timeZone).utc().format('HH:mm');
}

/**
 * Formats a UTC time string to the specified format.
 * @param utcTime - The UTC time string to format in 'HH:mm' format.
 * @param format - The format to use. Defaults to 'HH:mm'.
 * @returns The formatted time string.
 */
export function formatUTCTime(utcTime: string, format = 'HH:mm') {
  return moment.utc(utcTime, 'HH:mm').format(format);
}
