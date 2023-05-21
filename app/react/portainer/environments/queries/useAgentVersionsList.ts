import { useQuery } from 'react-query';

import { getAgentVersions } from '../environment.service';

import { queryKeys } from './query-keys';

export function useAgentVersionsList() {
  return useQuery([...queryKeys.base(), 'agentVersions'], () =>
    getAgentVersions()
  );
}
