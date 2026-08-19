import { EdgeJob } from '../../types';
import { queryKeys as edgeJobQueryKeys } from '../query-keys';

export const queryKeys = {
  base: (id: EdgeJob['Id']) =>
    [...edgeJobQueryKeys.item(id), 'results'] as const,
};
