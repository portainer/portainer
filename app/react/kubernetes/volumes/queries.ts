import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { getPVCsForCluster } from './service';

// useQuery to get a list of all applications from an array of namespaces
export function usePVCsForCluster(
  environemtId: EnvironmentId,
  namespaces: string[],
  isNamespaceFresh: boolean
) {
  return useQuery(
    ['environments', environemtId, 'kubernetes', 'pvcs'],
    () => getPVCsForCluster(environemtId, namespaces),
    {
      ...withError('Unable to retrieve applications'),
      // wait until fresh namespaces are loaded (isNamespaceFresh), so that standard users don't get 403 errors for applications in admin namespaces
      enabled: !!namespaces.length && isNamespaceFresh,
    }
  );
}
