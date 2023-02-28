import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';
import { useNodesCount } from '@/react/portainer/system/useNodesCount';

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

export function useIntegratedLicenseInfo() {
  const { isLoading: isLoadingNodes, data: nodesCount = 0 } = useNodesCount();

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
