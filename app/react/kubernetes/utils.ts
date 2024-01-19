import { Annotation } from './annotations/types';

export function parseCpu(cpu: string) {
  let res = parseInt(cpu, 10);
  if (cpu.endsWith('m')) {
    res /= 1000;
  } else if (cpu.endsWith('n')) {
    res /= 1000000000;
  }
  return res;
}

export function prepareAnnotations(annotations?: Annotation[]) {
  const result = annotations?.reduce(
    (acc, a) => {
      acc[a.Key] = a.Value;
      return acc;
    },
    {} as Record<string, string>
  );
  return result;
}
