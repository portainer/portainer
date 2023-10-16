export function parseCpu(cpu: string) {
  let res = parseInt(cpu, 10);
  if (cpu.endsWith('m')) {
    res /= 1000;
  } else if (cpu.endsWith('n')) {
    res /= 1000000000;
  }
  return res;
}
