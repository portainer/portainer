import { FormikErrors } from 'formik';
import { SetStateAction } from 'react';

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

export interface FieldsetValues<TFieldset> {
  values: TFieldset;
  errors?: FormikErrors<TFieldset>;
}

export type SetFieldValue<TFieldset> = <TField>(
  field: keyof TFieldset,
  value: TField
) => void;

export type SetValues<TFieldset> = SetStateAction<TFieldset>;

export type OnChange<TFieldset> = (value: TFieldset) => void;
