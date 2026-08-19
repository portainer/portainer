import { Task } from 'docker-types';

export type TaskId = NonNullable<Task['ID']>;

export type TaskLogsParams = {
  stdout?: boolean;
  stderr?: boolean;
  timestamps?: boolean;
  since?: number;
  tail?: number;
};
