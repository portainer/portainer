import { useEffect } from 'react';
import { useQuery } from 'react-query';

import { getDevices } from '@/portainer/hostmanagement/open-amt/open-amt.service';
import { EnvironmentId } from '@/portainer/environments/types';
import PortainerError from '@/portainer/error';
import * as notifications from '@/portainer/services/notifications';

export function useAMTDevices(environmentId: EnvironmentId) {
  const { isLoading, data, isError, error } = useQuery(
    ['amt_devices', environmentId],
    () => getDevices(environmentId),
    {
      retry: false,
    }
  );

  useEffect(() => {
    if (isError) {
      notifications.error(
        'Failure',
        error as Error,
        'Failed retrieving AMT devices'
      );
    }
  }, [isError, error]);

  return {
    isLoading,
    devices: data,
    error: isError ? (error as PortainerError) : undefined,
  };
}
