import { CreateNamespaceFormValues, CreateNamespacePayload } from './types';

export function transformFormValuesToNamespacePayload(
  createNamespaceFormValues: CreateNamespaceFormValues,
  owner: string
): CreateNamespacePayload {
  const memoryInBytes =
    Number(createNamespaceFormValues.resourceQuota.memory) * 10 ** 6;
  return {
    Name: createNamespaceFormValues.name,
    Owner: owner,
    ResourceQuota: {
      enabled: createNamespaceFormValues.resourceQuota.enabled,
      cpu: createNamespaceFormValues.resourceQuota.cpu,
      memory: `${memoryInBytes}`,
    },
  };
}
