import { EdgeStack, StatusType } from '../../types';

export type DecoratedEdgeStack = EdgeStack & {
  aggregatedStatus: Partial<Record<StatusType, number>>;
};
