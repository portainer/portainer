import { useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';

import { getDevices } from '@/portainer/hostmanagement/open-amt/open-amt.service';
import { EnvironmentId } from '@/portainer/environments/types';
import PortainerError from '@/portainer/error';
import * as notifications from '@/portainer/services/notifications';

export function useAMTDevices(environmentId: EnvironmentId) {
  const { isLoading, data, isError, error } = useQuery(
    ['amt_devices', environmentId],
    () => getDevices(environmentId)
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

  const devices = useMemo(() => data || [], [data]);

  return {
    isLoading,
    devices,
    error: isError ? (error as PortainerError) : undefined,
  };
}
