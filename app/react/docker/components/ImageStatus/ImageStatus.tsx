import { Loader } from 'lucide-react';

import { useEnvironment } from '@/react/portainer/environments/queries';
import { statusIcon } from '@/react/docker/components/ImageStatus/helpers';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { Icon } from '@@/Icon';

import { ResourceID, ResourceType } from './types';
import { useImageNotification } from './useImageNotification';

export interface Props {
  environmentId: EnvironmentId;
  resourceId: ResourceID;
  resourceType?: ResourceType;
  nodeName?: string;
}

export function ImageStatus({
  environmentId,
  resourceId,
  resourceType = ResourceType.CONTAINER,
  nodeName = '',
}: Props) {
  const enableImageNotificationQuery = useEnvironment(
    environmentId,
    (environment) => environment?.EnableImageNotification
  );

  const { data, isLoading, isError } = useImageNotification(
    environmentId,
    resourceId,
    resourceType,
    nodeName,
    enableImageNotificationQuery.data
  );

  if (!enableImageNotificationQuery.data || isError) {
    return null;
  }

  if (!isBE) {
    return null;
  }

  if (isLoading || !data) {
    return (
      <Icon
        icon={Loader}
        size="sm"
        className="!mr-1 animate-spin-slow align-middle"
      />
    );
  }

  return (
    <Icon icon={statusIcon(data)} size="sm" className="!mr-1 align-middle" />
  );
}
