import { EnvironmentId } from '../types';

export function buildUrl(id?: EnvironmentId, action?: string) {
  let baseUrl = 'endpoints';
  if (id) {
    baseUrl += `/${id}`;
  }

  if (action) {
    baseUrl += `/${action}`;
  }

  return baseUrl;
}

export function arrayToJson<T>(arr?: Array<T>) {
  if (!arr) {
    return '';
  }

  return JSON.stringify(arr);
}

export function json2formData(json: Record<string, unknown>) {
  const formData = new FormData();

  Object.entries(json).forEach(([key, value]) => {
    if (typeof value === 'undefined' || value === null) {
      return;
    }

    formData.append(key, value as string);
  });

  return formData;
}
