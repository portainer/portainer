import { useQuery } from '@tanstack/react-query';

import { getAgentVersions } from '../environment.service';

import { environmentQueryKeys } from './query-keys';

export function useAgentVersionsList() {
  return useQuery([...environmentQueryKeys.base(), 'agentVersions'], () =>
    getAgentVersions()
  );
}
