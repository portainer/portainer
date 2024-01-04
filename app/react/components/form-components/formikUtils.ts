import { FormikErrors } from 'formik';

export function isErrorType<T>(
  error: string | FormikErrors<T> | undefined
): error is FormikErrors<T> {
  return error !== undefined && typeof error !== 'string';
}

export function isArrayErrorType<T>(
  error:
    | string[]
    | FormikErrors<T>[]
    | string
    | undefined
    | (FormikErrors<T> | undefined)[]
): error is FormikErrors<T>[] {
  return error !== undefined && typeof error !== 'string';
}
