import Axios, { AxiosError } from 'axios';

export function isAxiosError<ResponseType>(
  error: unknown
): error is AxiosError<ResponseType> {
  return Axios.isAxiosError(error);
}
