import { FormikErrors } from 'formik';

export function isServicePortError<T>(
  error: string | FormikErrors<T> | undefined
): error is FormikErrors<T> {
  return error !== undefined && typeof error !== 'string';
}

export function newPort(serviceName?: string) {
  return {
    port: 0,
    targetPort: 0,
    name: '',
    protocol: 'TCP',
    nodePort: 0,
    serviceName,
  };
}
