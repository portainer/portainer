import { ResourceReservation } from '@/react/kubernetes/components/ResourceReservation';

import { ResourceQuotaFormValues } from './types';
import { useNamespaceResourceReservationData } from './useNamespaceResourceReservationData';

interface Props {
  namespaceName: string;
  environmentId: number;
  resourceQuotaValues: ResourceQuotaFormValues;
}

export function NamespaceResourceReservation({
  environmentId,
  namespaceName,
  resourceQuotaValues,
}: Props) {
  const {
    cpuLimit,
    memoryLimit,
    displayResourceUsage,
    resourceUsage,
    resourceReservation,
    isLoading,
  } = useNamespaceResourceReservationData(
    environmentId,
    namespaceName,
    resourceQuotaValues
  );

  if (!resourceQuotaValues.enabled) {
    return null;
  }

  return (
    <ResourceReservation
      displayResourceUsage={displayResourceUsage}
      resourceReservation={resourceReservation}
      resourceUsage={resourceUsage}
      cpuLimit={cpuLimit}
      memoryLimit={memoryLimit}
      description="Resource reservation represents the total amount of resource assigned to all the applications deployed inside this namespace."
      isLoading={isLoading}
    />
  );
}
