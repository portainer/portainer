import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';
import { EdgeTypes, EnvironmentId } from '@/react/portainer/environments/types';

export function useEnvironments(environmentsIds: Array<EnvironmentId>) {
  const environmentsQuery = useEnvironmentList(
    { endpointIds: environmentsIds, types: EdgeTypes },
    {
      enabled: environmentsIds.length > 0,
    }
  );

  return environmentsQuery.environments;
}
