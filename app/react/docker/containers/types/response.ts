import {
  EndpointSettings,
  MountPoint,
  Port,
} from 'docker-types/generated/1.41';

import { PortainerMetadata } from '@/react/docker/types';

export interface SummaryNetworkSettings {
  Networks: { [key: string]: EndpointSettings | undefined };
}

export interface Health {
  Status: 'healthy' | 'unhealthy' | 'starting';
  FailingStreak: number;
  Log: Array<{ Output: string }>;
}

export interface DockerContainerResponse {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Command: string;
  Created: number;
  Ports: Port[];
  SizeRw?: number;
  SizeRootFs?: number;
  Labels: { [key: string]: string };
  State: string;
  Status: string;
  HostConfig: {
    NetworkMode?: string;
  };
  NetworkSettings?: SummaryNetworkSettings;
  Mounts: MountPoint[];
  Portainer: PortainerMetadata;
  IsPortainer: boolean;
}
