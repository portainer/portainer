import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { getNodesCount } from '../services/api/status.service';

import { getLicenseInfo } from './license.service';
import { LicenseInfo, LicenseType } from './types';

export function useLicenseInfo() {
  const { isLoading, data: info } = useQuery<LicenseInfo, Error>(
    'licenseInfo',
    () => getLicenseInfo(),
    {
      onError(error) {
        notifyError('Failure', error as Error, 'Failed to get license info');
      },
    }
  );

  return { isLoading, info };
}

function useNodesCounts() {
  const { isLoading, data } = useQuery(
    ['status', 'nodes'],
    () => getNodesCount(),
    {
      onError(error) {
        notifyError('Failure', error as Error, 'Failed to get nodes count');
      },
    }
  );

  return { nodesCount: data || 0, isLoading };
}

export function useIntegratedLicenseInfo() {
  const { isLoading: isLoadingNodes, nodesCount } = useNodesCounts();

  const { isLoading: isLoadingLicense, info } = useLicenseInfo();
  if (
    isLoadingLicense ||
    isLoadingNodes ||
    !info ||
    info.type === LicenseType.Trial
  ) {
    return null;
  }

  return { licenseInfo: info as LicenseInfo, usedNodes: nodesCount };
}
