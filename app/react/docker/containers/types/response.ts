import { ContainerSummary } from 'docker-types';

import { PortainerResponse } from '@/react/docker/types';
import { WithRequiredProperties } from '@/types';

export type SummaryNetworkSettings = NonNullable<
  ContainerSummary['NetworkSettings']
>;

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
