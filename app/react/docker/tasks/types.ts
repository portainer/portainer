import { Task } from 'docker-types/generated/1.44';

export type TaskId = NonNullable<Task['ID']>;

export type TaskLogsParams = {
  stdout?: boolean;
  stderr?: boolean;
  timestamps?: boolean;
  since?: number;
  tail?: number;
};
