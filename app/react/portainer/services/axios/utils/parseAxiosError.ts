import { AxiosError } from 'axios';

import PortainerError from '@/portainer/error';

import { isAxiosError } from './isAxiosError';

/**
 * Parses an Axios error and returns a PortainerError.
 * @param err The original error.
 * @param msg An optional error message to prepend.
 * @param parseError A function to parse AxiosErrors. Defaults to defaultErrorParser.
 * @returns A PortainerError with the parsed error message and details.
 */
export function parseAxiosError(
  err: unknown,
  msg = '',
  parseError = defaultErrorParser
) {
  if (err instanceof PortainerError) {
    return err;
  }

  let resultErr = err;
  let resultMsg = msg;

  if (isAxiosError(err)) {
    const { error, details } = parseError(err);
    resultErr = error;
    if (msg && details) {
      resultMsg = `${msg}: ${details}`;
    } else {
      resultMsg = msg || details;
    }
  }

  return new PortainerError(resultMsg, resultErr);
}

type DefaultAxiosErrorType = {
  message: string;
  details?: string;
};

export function defaultErrorParser(axiosError: AxiosError<unknown>) {
  const { message, details } = extractErrorDetails(axiosError);
  const error = new Error(message);
  return { error, details };
}

/**
 * Simplify the error handling strategy
 * Uses multiple fallbacks to give the user a helpful error response
 */
function extractErrorDetails(axiosError: AxiosError): {
  message: string;
  details: string;
} {
  const { data } = axiosError.response || {};
  if (data && typeof data === 'object') {
    const errorObj = data as Record<string, unknown>;

    if (isMultipleErrorsResponse(data)) {
      const firstError = data.errors[0];
      return {
        message: firstError.message || '',
        details: firstError.details || firstError.message || '',
      };
    }

    if (Array.isArray(data) && data.length > 0 && isDefaultResponse(data[0])) {
      return {
        message: data[0].message || '',
        details: data[0].details || data[0].message || '',
      };
    }

    if (isDefaultResponse(data)) {
      return {
        message: data.message || '',
        details: data.details || data.message || '',
      };
    }

    const commonErrorProps = [
      errorObj.error,
      errorObj.err,
      errorObj.msg,
      errorObj.message,
      errorObj.detail,
      errorObj.details,
    ];

    const errorValue = commonErrorProps.find(
      (value): value is string => typeof value === 'string' && value.length > 0
    );

    if (errorValue) {
      return { message: errorValue, details: errorValue };
    }

    const stringValues = Object.values(errorObj).filter(
      (value): value is string => typeof value === 'string' && value.length > 0
    );

    if (stringValues.length > 0) {
      return { message: stringValues[0], details: stringValues[0] };
    }

    const status = axiosError.response?.status;
    const fallback = status
      ? `Server returned error: ${status}`
      : 'Server returned an error response';
    return { message: fallback, details: fallback };
  }

  if (data && typeof data === 'string') {
    return { message: data, details: data };
  }

  if (data) {
    const stringValue = String(data);
    return { message: stringValue, details: stringValue };
  }

  // Fallback: Use response status or statusText when available
  if (axiosError.response) {
    const { status, statusText } = axiosError.response;

    if (statusText) {
      return {
        message: statusText,
        details: statusText,
      };
    }

    if (status) {
      const message = `Server returned error: ${status}`;
      return { message, details: message };
    }

    return {
      message: 'Server returned an error response',
      details: 'Server returned an error response',
    };
  }

  // Final fallback: Use axios error message if available
  if (axiosError.message) {
    return { message: axiosError.message, details: axiosError.message };
  }

  const fallback = 'An unknown error occurred';
  return { message: fallback, details: fallback };
}

function isMultipleErrorsResponse(data: unknown): data is {
  errors: DefaultAxiosErrorType[];
} {
  return (
    !!data &&
    typeof data === 'object' &&
    'errors' in data &&
    Array.isArray(data.errors) &&
    data.errors.length > 0
  );
}
export function isDefaultResponse(
  data: unknown
): data is DefaultAxiosErrorType {
  return (
    !!data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  );
}
