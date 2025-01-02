import { endsWith } from 'lodash';
import filesizeParser from 'filesize-parser';

export const KubernetesPortainerResourceQuotaPrefix = 'portainer-rq-';

export function generateResourceQuotaName(name: string) {
  return `${KubernetesPortainerResourceQuotaPrefix}${name}`;
}

/**
 * parseCPU converts a CPU string to a number in cores.
 * It supports m (milli), u (micro), n (nano), p (pico) suffixes.
 *
 * If given an empty string, it returns 0.
 */
export function parseCPU(cpu: string) {
  let res = parseInt(cpu, 10);
  if (Number.isNaN(res)) {
    return 0;
  }

  if (endsWith(cpu, 'm')) {
    // milli
    res /= 1000;
  } else if (endsWith(cpu, 'u')) {
    // micro
    res /= 1000000;
  } else if (endsWith(cpu, 'n')) {
    // nano
    res /= 1000000000;
  } else if (endsWith(cpu, 'p')) {
    // pico
    res /= 1000000000000;
  }
  return res;
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
 * The default base is 2, you can use base 10 if you want
 * https://github.com/patrickkettner/filesize-parser#readme
 */
function safeFilesizeParser(value: string | number, base: 2 | 10 = 2) {
  if (!value || Number.isNaN(value)) {
    return 0;
  }

  return filesizeParser(value, { base });
}
