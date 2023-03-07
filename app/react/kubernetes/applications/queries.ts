import { useQuery } from 'react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { withError } from '@/react-tools/react-query';

import { getApplicationsListForCluster } from './service';

// useQuery to get a list of all applications from an array of namespaces
export function useApplicationsForCluster(
  environemtId: EnvironmentId,
  namespaces?: string[]
) {
  return useQuery(
    ['environments', environemtId, 'kubernetes', 'applications'],
    () => namespaces && getApplicationsListForCluster(environemtId, namespaces),
    {
      ...withError('Unable to retrieve applications'),
      enabled: !!namespaces,
    }
  );
}
