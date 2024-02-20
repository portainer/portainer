import { NumberSchema, number } from 'yup';

/**
 * Returns a Yup schema for a number that can also be NaN.
 *
 * This function is a workaround for a known issue in Yup where it throws type errors
 * when the number input is empty, having a value NaN. Yup doesn't like NaN values.
 * More details can be found in these GitHub issues:
 * https://github.com/jquense/yup/issues/1330
 * https://github.com/jquense/yup/issues/211
 *
 * @param errorMessage The custom error message to display when the value is required.
 * @returns A Yup number schema with a custom type error message.
 */
export function nanNumberSchema(
  errorMessage = 'Value is required'
): NumberSchema {
  return number().typeError(errorMessage);
}
