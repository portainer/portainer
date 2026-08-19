import { AxiosError } from 'axios';

export function azureErrorParser(axiosError: AxiosError) {
  if (!axiosError.response) {
    const error = new Error('Failed azure request');
    return {
      error,
      details: axiosError.message,
    };
  }

  const responseData = axiosError.response.data;
  const message =
    responseData &&
    typeof responseData === 'object' &&
    'error' in responseData &&
    typeof responseData.error === 'string'
      ? responseData.error
      : `Failed azure request: ${axiosError.response?.statusText}`;

  return {
    error: new Error(message),
    details: message,
  };
}
