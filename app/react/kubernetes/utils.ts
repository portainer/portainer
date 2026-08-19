import { filesize } from 'filesize';
import { FileSizeOptions } from 'filesize/types/filesize';
import filesizeParser from 'filesize-parser';

import { Annotation } from './annotations/types';

/**
 * parseCPU converts a CPU string to a number in cores.
 * It supports m (milli), u (micro), n (nano), p (pico) suffixes.
 *
 * If given an empty string, it returns 0.
 */
export function parseCPU(cpu: string) {
  if (!cpu) {
    return 0;
  }

  let res = parseInt(cpu, 10);
  if (cpu.endsWith('m')) {
    res /= 1000;
  } else if (cpu.endsWith('u')) {
    res /= 1000000;
  } else if (cpu.endsWith('n')) {
    res /= 1000000000;
  } else if (cpu.endsWith('p')) {
    res /= 1000000000000;
  }
  return res;
}

/**
 * Converts a byte value to a human-readable string format
 *
 * In Kubernetes, resource measurements for memory are typically in binary units (KiB, MiB, GiB).
 * This function formats raw byte values into human-readable strings using the IEC standard
 * by default, which is the standard used in Kubernetes resource specifications.
 *
 * @param memoryBytes - The memory size in bytes
 * @param options - Options for formatting (defaults to IEC standard)
 * @returns Human-readable memory size (e.g., "100 MiB")
 */
export function bytesToReadableFormat(
  memoryBytes: number,
  options: FileSizeOptions = {
    output: 'string',
    // IEC is used by default, because it's the most common standard for memory units in Kubernetes.
    standard: 'iec',
  }
) {
  return filesize(memoryBytes, options);
}

/**
 * Gets a value in mebibytes (MiB) using the filesize library
 *
 * This function always returns the memory value converted to MiB,
 * regardless of the size. It uses the filesize library with specific
 * configuration to ensure consistent MiB output.
 *
 * @param memoryBytes - The memory size in bytes
 * @returns The memory size in MiB as a number
 */
export function getMebibytes(memoryBytes: number): number {
  const result = filesize(memoryBytes, {
    standard: 'iec',
    output: 'array',
    exponent: 2, // Force MiB as the unit (2^20 bytes)
    round: 0,
  });

  // Return just the numerical value (first element of the array)
  return result[0];
}

/**
 * Parses a value using the filesize-parser library and gives the result in bytes.
 *
 * This function handles both string and number inputs.
 * If the base is not provided, the value is a string and it contains 'i' (e.g. "100MiB"), use base 2 (binary/IEC).
 * Otherwise, it uses the provided base (defaulting to 10).
 */
export function safeFilesizeParser(value: string | number, base?: 2 | 10) {
  if (!value || Number.isNaN(value)) {
    return 0;
  }

  // If the value is a string and contains 'i' (e.g. "100MiB"), use base 2 (binary/IEC)
  const hasBinaryUnit = typeof value === 'string' && value.includes('i');
  const inferredBase = hasBinaryUnit ? 2 : 10;

  return filesizeParser(value, { base: base ?? inferredBase });
}

export function prepareAnnotations(annotations?: Annotation[]) {
  const result = annotations?.reduce(
    (acc, a) => {
      acc[a.key] = a.value;
      return acc;
    },
    {} as Record<string, string>
  );
  return result;
}

/**
 * Returns the safe value of the given number or string.
 * @param value - The value to get the safe value for.
 * @returns The safe value of the given number or string.
 */
export function getSafeValue(value: number | string) {
  const valueNumber = Number(value);
  if (Number.isNaN(valueNumber)) {
    return 0;
  }
  return valueNumber;
}

/**
 * Returns the percentage of the value over the total.
 * @param value - The value to calculate the percentage for.
 * @param total - The total value to compare the percentage to.
 * @returns The percentage of the value over the total, with the '- ' string prefixed, for example '- 50%'.
 */
export function getPercentageString(value: number, total?: number | string) {
  const totalNumber = Number(total);
  if (
    totalNumber === 0 ||
    total === undefined ||
    total === '' ||
    Number.isNaN(totalNumber)
  ) {
    return '';
  }
  if (value > totalNumber) {
    return '- Exceeded';
  }
  return `- ${Math.round((value / totalNumber) * 100)}%`;
}
