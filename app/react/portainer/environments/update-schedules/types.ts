import { EnvironmentId } from '@/react/portainer/environments/types';
import { UserId } from '@/portainer/users/types';
import { EdgeGroup } from '@/react/edge/edge-groups/types';

export enum ScheduleType {
  Update = 1,
  Rollback,
}

export enum StatusType {
  Pending,
  Failed,
  Success,
  Sent,
}

export type EdgeUpdateSchedule = {
  id: number;
  name: string;

  type: ScheduleType;

  created: number;
  createdBy: UserId;
  version: string;
  environmentsPreviousVersions: Record<EnvironmentId, string>;
};

export type EdgeUpdateResponse = EdgeUpdateSchedule & {
  // from edge stack:
  edgeGroupIds: EdgeGroup['Id'][];
  scheduledTime: string;
};
