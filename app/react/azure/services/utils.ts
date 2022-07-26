import { AxiosError } from 'axios';

export function azureErrorParser(axiosError: AxiosError) {
  const message =
    (axiosError.response?.data?.error?.message as string) ||
    'Failed azure request';

  return {
    error: new Error(message),
    details: message,
  };
}
