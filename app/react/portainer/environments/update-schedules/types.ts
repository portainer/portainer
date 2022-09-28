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
}

interface Status {
  status: StatusType;
  error: string;
  targetVersion: string;
  currentVersion: string;
}

export type EdgeUpdateSchedule = {
  id: number;
  name: string;
  time: number;
  groupIds: EdgeGroup['Id'][];
  type: ScheduleType;
  status: { [key: EnvironmentId]: Status };
  created: number;
  createdBy: UserId;
};
