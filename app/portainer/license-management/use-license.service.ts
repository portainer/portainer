import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { error as notifyError } from '@/portainer/services/notifications';

import { getLicenseInfo } from './license.service';
import { LicenseInfo } from './types';

export function useLicenseInfo() {
  const {
    isLoading,
    error,
    isError,
    data: info,
  } = useQuery<LicenseInfo, Error>('licenseInfo', () => getLicenseInfo());

  useEffect(() => {
    if (isError) {
      notifyError('Failure', error as Error, 'Failed to get license info');
    }
  }, [error, isError]);

  return { isLoading, error, info };
}
