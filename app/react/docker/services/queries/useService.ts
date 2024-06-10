import { useQuery } from '@tanstack/react-query';
import { Service } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError } from '@/react-tools/react-query';
import { ServiceId } from '@/react/docker/services/types';
import { queryKeys } from '@/react/docker/services/queries/query-keys';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { buildUrl } from '@/react/docker/services/queries/build-url';

export function useService(environmentId: EnvironmentId, serviceId: ServiceId) {
  return useQuery(
    queryKeys.service(environmentId, serviceId),
    () => getService(environmentId, serviceId),
    {
      enabled: !!serviceId,
      ...withGlobalError('Unable to retrieve service'),
    }
  );
}

export async function getService(
  environmentId: EnvironmentId,
  serviceId: ServiceId
) {
  try {
    const { data } = await axios.get<Service>(
      buildUrl(environmentId, serviceId)
    );

    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get service');
  }
}
