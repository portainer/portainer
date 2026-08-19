import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';
import { EdgeGroupId, EdgeTypes } from '@/react/portainer/environments/types';

export function useEnvironments(edgeGroupIds: Array<EdgeGroupId>) {
  const environmentsQuery = useEnvironmentList(
    { edgeGroupIds, types: EdgeTypes, pageLimit: 0, excludeSnapshots: true },
    {
      enabled: edgeGroupIds.length > 0,
    }
  );

  return environmentsQuery.environments;
}
