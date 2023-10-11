import { CreateNamespaceFormValues, CreateNamespacePayload } from './types';

export function transformFormValuesToNamespacePayload(
  createNamespaceFormValues: CreateNamespaceFormValues
): CreateNamespacePayload {
  const memoryInBytes =
    Number(createNamespaceFormValues.resourceQuota.memory) * 10 ** 6;
  return {
    Name: createNamespaceFormValues.name,
    ResourceQuota: {
      enabled: createNamespaceFormValues.resourceQuota.enabled,
      cpu: createNamespaceFormValues.resourceQuota.cpu,
      memory: `${memoryInBytes}`,
    },
  };
}
