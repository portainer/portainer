import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { getLicenseInfo } from './license.service';
import { LicenseInfo } from './types';

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
