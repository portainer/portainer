import { useMutation } from 'react-query';

import { getMetricsForAllNodes } from '../services/service';

// use this as a mutation because the metrics request should be manually fired when the user clicks to turn the metrics toggle on
export function useGetMetricsMutation() {
  return useMutation(getMetricsForAllNodes);
}
