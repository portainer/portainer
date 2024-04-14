import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { statusIcon } from '@/react/docker/components/ImageStatus/helpers';

import { Icon } from '@@/Icon';

import { getStackImagesStatus } from './getStackImagesStatus';

export interface Props {
  stackId: number;
  environmentId: number;
}

export function StackImageStatus({ stackId, environmentId }: Props) {
  const { data, isLoading, isError } = useStackImageNotification(
    stackId,
    environmentId
  );

  if (isError) {
    return null;
  }

  if (isLoading || !data) {
    return (
      <Icon
        icon={Loader2}
        size="sm"
        className="!mr-1 animate-spin-slow align-middle"
      />
    );
  }

  return <Icon icon={statusIcon(data)} className="!mr-1 align-middle" />;
}

export function useStackImageNotification(
  stackId: number,
  environmentId?: EnvironmentId
) {
  const enableImageNotificationQuery = useEnvironment(
    environmentId,
    (environment) => environment?.EnableImageNotification
  );

  return useQuery(
    ['stacks', stackId, 'images', 'status'],
    () => getStackImagesStatus(stackId),
    {
      enabled: enableImageNotificationQuery.data,
    }
  );
}
