import { safeFilesizeParser } from '../utils';

export const KubernetesPortainerResourceQuotaPrefix = 'portainer-rq-';

export function generateResourceQuotaName(name: string) {
  return `${KubernetesPortainerResourceQuotaPrefix}${name}`;
}

export function terabytesValue(value: string | number) {
  return gigabytesValue(value) / 1000;
}

export function gigabytesValue(value: string | number) {
  return megaBytesValue(value) / 1000;
}

export function megaBytesValue(value: string | number) {
  return Math.floor(safeFilesizeParser(value, 10) / 1000 / 1000);
}

export function bytesValue(mem: string | number) {
  return safeFilesizeParser(mem, 10) * 1000 * 1000;
}

/**
 * Coverts Ki, Gi, Ti, Pi, Ei suffix values to Mi string
 * Used for kubernetes memory conversions currently
 */
export function convertBase2ToMiB(value: string | number) {
  if (typeof value === 'number') {
    return value;
  }

  // Extract the numeric part and suffix
  const match = value.match(/^(\d+(?:\.\d+)?)([A-Za-z]*)$/);
  if (!match) {
    return value;
  }

  const numericValue = parseFloat(match[1]);
  const suffix = match[2];

  switch (suffix) {
    case 'Mi':
      return `${numericValue}Mi`;
    case 'Gi':
      return `${numericValue * 1024}Mi`;
    case 'Ti':
      return `${numericValue * 1024 * 1024}Mi`;
    case 'Pi':
      return `${numericValue * 1024 * 1024 * 1024}Mi`;
    case 'Ei':
      return `${numericValue * 1024 * 1024 * 1024 * 1024}Mi`;
    default:
      return value;
  }
}
