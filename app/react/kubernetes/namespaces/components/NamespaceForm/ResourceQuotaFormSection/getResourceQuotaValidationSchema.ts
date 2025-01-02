import { boolean, string, object, SchemaOf, TestContext } from 'yup';

import { ResourceQuotaFormValues } from './types';

export function getResourceQuotaValidationSchema(
  memoryLimit: number,
  cpuLimit: number
): SchemaOf<ResourceQuotaFormValues> {
  return object({
    enabled: boolean().required('Resource quota enabled status is required.'),
    memory: string()
      .test(
        'non-negative-memory-validation',
        'Existing namespaces already have memory limits exceeding what is available in the cluster. Before you can set values here, you must reduce amounts in namespaces (and you may have to turn on over-commit temporarily to do so).',
        () => nonNegativeLimit(memoryLimit)
      )
      .test(
        'memory-validation',
        `Value must be between 0 and ${memoryLimit}.`,
        memoryValidation
      ),
    cpu: string()
      .test(
        'non-negative-memory-validation',
        'Existing namespaces already have CPU limits exceeding what is available in the cluster. Before you can set values here, you must reduce amounts in namespaces (and you may have to turn on over-commit temporarily to do so).',
        () => nonNegativeLimit(cpuLimit)
      )
      .test('cpu-validation', 'CPU limit value is required.', cpuValidation),
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

  function nonNegativeLimit(limit: number) {
    return limit >= 0;
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
