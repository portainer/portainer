import { EnvironmentId } from '@/portainer/environments/types';
import { UserId } from '@/portainer/users/types';
import { EdgeGroup } from '@/react/edge/edge-groups/types';

export enum ScheduleType {
  Update = 1,
  Rollback,
}

export enum StatusType {
  Pending,
  Sent,
  Success,
  Failed,
}

export interface ScheduleStatus {
  status: StatusType;
  error: string;
  targetVersion: string;
  currentVersion: string;
}

export type EdgeUpdateSchedule = {
  id: number;
  name: string;
  time: string;
  groupIds: EdgeGroup['Id'][];
  type: ScheduleType;
  status: { [key: EnvironmentId]: ScheduleStatus };
  created: number;
  createdBy: UserId;
};
