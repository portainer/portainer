import { useEffect } from 'react';
import { useQuery } from 'react-query';

import PortainerError from '@/portainer/error';
import * as notifications from '@/portainer/services/notifications';
import { getProfiles } from '@/portainer/hostmanagement/fdo/fdo.service';

export function useFDOProfiles() {
  const { isLoading, data, isError, error } = useQuery(
    ['fdo_profiles'],
    () => getProfiles(),
    {
      retry: false,
    }
  );

  useEffect(() => {
    if (isError) {
      notifications.error(
        'Failure',
        error as Error,
        'Failed retrieving FDO profiles'
      );
    }
  }, [isError, error]);

  return {
    isLoading,
    profiles: data,
    error: isError ? (error as PortainerError) : undefined,
  };
}
