import { EdgeStack, StatusType } from '../../types';

export enum SummarizedStatus {
  Unavailable = 'Unavailable',
  Deploying = 'Deploying',
  Failed = 'Failed',
  Paused = 'Paused',
  PartiallyRunning = 'PartiallyRunning',
  Completed = 'Completed',
  Running = 'Running',
}

export type StatusSummary = {
  AggregatedStatus?: Partial<Record<StatusType, number>>;
  Status: SummarizedStatus;
  Reason: string;
};

export type DecoratedEdgeStack = EdgeStack & {
  StatusSummary?: StatusSummary;
};
