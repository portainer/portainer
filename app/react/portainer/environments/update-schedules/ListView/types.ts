import { EdgeUpdateListItemResponse } from '../queries/list';

export type DecoratedItem = EdgeUpdateListItemResponse & {
  edgeGroupNames: string[];
};
