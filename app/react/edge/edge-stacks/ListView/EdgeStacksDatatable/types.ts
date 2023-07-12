import { EdgeStack } from '../../types';

interface AggregateStackStatus {
  ok: number;
  error: number;
  acknowledged: number;
  imagesPulled: number;
}

export type DecoratedEdgeStack = EdgeStack & {
  aggregatedStatus: AggregateStackStatus;
};
