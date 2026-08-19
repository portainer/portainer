export function toConfigMemory(value: number): number {
  if (value < 0) {
    return 0;
  }

  return round(Math.round(value * 8) / 8, 3) * 1024 * 1024;
}

export function toViewModelMemory(value = 0): number {
  if (value < 0) {
    return 0;
  }

  return value / 1024 / 1024;
}

export function round(value: number, decimals: number) {
  const tenth = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * tenth) / tenth;
}

export function toViewModelCpu(value = 0) {
  if (value < 0) {
    return 0;
  }

  return value / 1000000000;
}

export function toConfigCpu(value: number) {
  if (value < 0) {
    return 0;
  }

  return value * 1000000000;
}
