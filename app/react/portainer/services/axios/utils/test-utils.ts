import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Minimal stub for InternalAxiosRequestConfig used in test mocks
 */
function createMockConfig(): InternalAxiosRequestConfig {
  return {
    url: '',
    method: 'get',
    headers: {},
  } as InternalAxiosRequestConfig;
}

/**
 * Helper function to create mock AxiosError objects for testing
 */
export function createMockAxiosError(
  responseData?: unknown,
  status?: number,
  statusText?: string,
  message?: string
): AxiosError {
  const config = createMockConfig();

  const response: AxiosResponse | undefined =
    responseData !== undefined ||
    status !== undefined ||
    statusText !== undefined
      ? {
          data: responseData,
          status: status ?? 500,
          statusText: statusText ?? '',
          headers: {},
          config,
        }
      : undefined;

  return new AxiosError(message, undefined, config, undefined, response);
}
