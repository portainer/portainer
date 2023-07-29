import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { getPVCsForCluster } from './service';

// useQuery to get a list of all persistent volume claims from an array of namespaces
export function usePVCsForCluster(
  environemtId: EnvironmentId,
  namespaces?: string[]
) {
  return useQuery(
    ['environments', environemtId, 'kubernetes', 'pvcs'],
    () => namespaces && getPVCsForCluster(environemtId, namespaces),
    {
      ...withError('Unable to retrieve perrsistent volume claims'),
      enabled: !!namespaces,
    }
  );
}
