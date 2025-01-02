import { ContainerSummary } from 'docker-types/generated/1.41';

import { PortainerResponse } from '@/react/docker/types';
import { WithRequiredProperties } from '@/types';

export type SummaryNetworkSettings = NonNullable<
  ContainerSummary['NetworkSettings']
>;

export interface Health {
  Status: 'healthy' | 'unhealthy' | 'starting';
  FailingStreak: number;
  Log: Array<{ Output: string }>;
}

/**
 * Raw container list response item
 */
export type DockerContainerResponse = PortainerResponse<
  WithRequiredProperties<
    ContainerSummary,
    | 'Id'
    | 'Names'
    | 'Image'
    | 'ImageID'
    | 'Command'
    | 'Created'
    | 'Ports'
    | 'Labels'
    | 'State'
    | 'Status'
    | 'HostConfig'
    | 'Mounts'
  >
>;
