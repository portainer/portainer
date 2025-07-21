import { Container } from 'kubernetes-types/core/v1';

import { BadgeType } from '@@/Badge';

export interface ContainerRowData extends Container {
  podName: string;
  nodeName: string;
  podIp: string;
  creationDate: string;
  status: {
    status: string;
    type: BadgeType;
    message?: string;
    hasLogs?: boolean;
    startedAt?: string;
    restartCount?: number;
  };
  isInit?: boolean;
  isSidecar?: boolean;
}
