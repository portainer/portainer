import { Container } from 'kubernetes-types/core/v1';

import { BadgeType } from '@@/Badge';

export interface ContainerStatusInfo {
  status: string;
  type: BadgeType;
  message?: string;
  hasLogs?: boolean;
  startedAt?: string;
  restartCount?: number;
}

export interface ContainerRowData extends Container {
  podName: string;
  status: ContainerStatusInfo;
  isInit?: boolean;
  isSidecar?: boolean;
}

export interface PodRowData {
  podName: string;
  nodeName: string;
  podIp: string;
  creationDate: string;
  status: ContainerStatusInfo;
  containers: ContainerRowData[];
  readyContainers: number;
  totalContainers: number;
}
