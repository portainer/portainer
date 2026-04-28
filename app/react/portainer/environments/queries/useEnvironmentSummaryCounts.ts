import { useQuery } from '@tanstack/react-query';

import { withGlobalError } from '@/react-tools/react-query';

import {
  getEnvironmentSummaryCounts,
  EnvironmentSummaryCounts,
} from '../environment.service';

import { ENVIRONMENTS_POLLING_INTERVAL } from './useEnvironmentList';
import { environmentQueryKeys } from './query-keys';

export type { EnvironmentSummaryCounts };

export function useEnvironmentSummaryCounts() {
  return useQuery(
    [...environmentQueryKeys.base(), 'summaryCounts'],
    () => getEnvironmentSummaryCounts(),
    {
      refetchInterval: ENVIRONMENTS_POLLING_INTERVAL,
      ...withGlobalError('Unable to retrieve environment summary counts'),
    }
  );
}
