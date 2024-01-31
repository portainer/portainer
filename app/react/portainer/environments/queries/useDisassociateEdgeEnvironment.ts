import { useMutation } from 'react-query';

import { useAnalytics } from '@/react/hooks/useAnalytics';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { EnvironmentId } from '../types';
import { buildUrl } from '../environment.service/utils';

export function useDisassociateEdgeEnvironment() {
  const { trackEvent } = useAnalytics();
  return useMutation({
    mutationFn: (environmentId: EnvironmentId) => {
      trackEvent('edge-endpoint-disassociate', { category: 'edge' });

      return disassociateEnvironment(environmentId);
    },
  });
}

export async function disassociateEnvironment(id: EnvironmentId) {
  try {
    await axios.delete(buildUrl(id, 'association'));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to disassociate environment');
  }
}
