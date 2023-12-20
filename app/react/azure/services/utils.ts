import { AxiosError } from 'axios';

export function azureErrorParser(axiosError: AxiosError) {
  const responseData = axiosError.response?.data;
  const message =
    responseData &&
    typeof responseData === 'object' &&
    'error' in responseData &&
    typeof responseData.error === 'string'
      ? responseData.error
      : 'Failed azure request';

  return {
    error: new Error(message),
    details: message,
  };
}
