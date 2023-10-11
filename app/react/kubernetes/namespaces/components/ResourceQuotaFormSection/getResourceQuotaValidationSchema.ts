import { boolean, string, object, SchemaOf, TestContext } from 'yup';

import { ResourceQuotaFormValues } from './types';

export function getResourceQuotaValidationSchema(
  memoryLimit: number
): SchemaOf<ResourceQuotaFormValues> {
  return object({
    enabled: boolean().required('Resource quota enabled status is required.'),
    memory: string().test(
      'memory-validation',
      `Value must be between 0 and ${memoryLimit}.`,
      memoryValidation
    ),
    cpu: string().test(
      'cpu-validation',
      'CPU limit value is required.',
      cpuValidation
    ),
  }).test(
    'resource-quota-validation',
    'At least a single limit must be set.',
    oneLimitSet
  );

  function oneLimitSet({
    enabled,
    memory,
    cpu,
  }: Partial<ResourceQuotaFormValues>) {
    return !enabled || (Number(memory) ?? 0) > 0 || (Number(cpu) ?? 0) > 0;
  }

  function memoryValidation(this: TestContext, memoryValue?: string) {
    const memory = Number(memoryValue) ?? 0;
    const { enabled } = this.parent;
    return !enabled || (memory >= 0 && memory <= memoryLimit);
  }

  function cpuValidation(this: TestContext, cpuValue?: string) {
    const cpu = Number(cpuValue) ?? 0;
    const { enabled } = this.parent;
    return !enabled || cpu >= 0;
  }
}
