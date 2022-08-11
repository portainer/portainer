import { useQuery } from 'react-query';

import { getAgentVersions } from '../environment.service';

export function useAgentVersionsList() {
  return useQuery(['environments', 'agentVersions'], () => getAgentVersions());
}
