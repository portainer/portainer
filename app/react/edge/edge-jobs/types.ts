import { EnvironmentId } from '@/react/portainer/environments/types';

export interface EdgeJob {
  Id: number;
  Created: number;
  CronExpression: string;
  Endpoints: Record<EnvironmentId, EndpointMeta>;
  EdgeGroups: number[] | null;
  Name: string;
  ScriptPath: string;
  Recurring: boolean;
  Version: number;
  /** Field used for log collection of Endpoints belonging to EdgeGroups */
  GroupLogsCollection: Record<EnvironmentId, EndpointMeta>;
}

export enum LogsStatus {
  Idle = 1,
  Pending = 2,
  Collected = 3,
}

interface EndpointMeta {
  LogsStatus: LogsStatus;
  CollectLogs: boolean;
}

export interface JobResult {
  Id: string;
  EndpointId: EnvironmentId;
  LogsStatus: LogsStatus;
}
