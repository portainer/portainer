import { EnvironmentId } from '@/react/portainer/environments/types';

export enum LogsStatus {
  Idle = 1,
  Pending,
  Collected,
}

export interface JobResult {
  Id: string;
  EndpointId: EnvironmentId;
  LogsStatus: LogsStatus;
}
