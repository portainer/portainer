import { Status } from 'kubernetes-types/meta/v1';
import { AxiosError } from 'axios';

import {
  defaultErrorParser,
  parseAxiosError,
} from '@/portainer/services/axios';

export function kubernetesErrorParser(axiosError: AxiosError) {
  const responseStatus = axiosError.response?.data as Status;
  const { message } = responseStatus;
  if (message) {
    return {
      error: new Error(message),
      details: message,
    };
  }
  return defaultErrorParser(axiosError);
}

/**
 * Parses an Axios error response from the Kubernetes API.
 * @param err The Axios error object.
 * @param msg An optional error message to prepend.
 * @returns An error object with an error message and details.
 */
export function parseKubernetesAxiosError(err: unknown, msg = '') {
  return parseAxiosError(err, msg, kubernetesErrorParser);
}
