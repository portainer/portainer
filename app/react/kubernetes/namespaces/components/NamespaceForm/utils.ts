import { NamespaceFormValues, NamespacePayload } from '../../types';

export function transformFormValuesToNamespacePayload(
  createNamespaceFormValues: NamespaceFormValues,
  owner: string
): NamespacePayload {
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
