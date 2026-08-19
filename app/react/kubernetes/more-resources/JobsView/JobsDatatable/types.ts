import { Container } from 'kubernetes-types/core/v1';

export type Job = {
  Id: string;
  Namespace: string;
  Name: string;
  PodName: string;
  Container?: Container;
  Command?: string;
  BackoffLimit?: number;
  Completions?: number;
  StartTime?: string;
  FinishTime?: string;
  Duration?: number;
  Status?: string;
  FailedReason?: string;
  IsSystem?: boolean;
};
