export type NomadEvent = {
  Type: string;
  Message: string;
  Date: number;
};

export type NomadEventsList = NomadEvent[];

export type Task = {
  JobID: string;
  Namespace: string;
  TaskName: string;
  State: string;
  TaskGroup: string;
  AllocationID: string;
  StartedAt: string;
};

export type Job = {
  ID: string;
  Status: string;
  Namespace: string;
  SubmitTime: string;
  Tasks: Task[];
};
