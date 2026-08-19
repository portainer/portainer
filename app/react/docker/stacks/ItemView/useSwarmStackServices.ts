import { useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useEnvironment } from '@/react/portainer/environments/queries';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { useTasks } from '@/react/docker/proxy/queries/tasks/useTasks';
import { queryKeys as tasksQueryKeys } from '@/react/docker/proxy/queries/tasks/query-keys';
import { TaskViewModel } from '@/docker/models/task';
import { useServices } from '@/react/docker/services/queries/useServices';
import { queryKeys as servicesQueryKeys } from '@/react/docker/services/queries/query-keys';
import { ServiceViewModel } from '@/docker/models/service';
import { useContainers } from '@/react/docker/containers/queries/useContainers';
import { queryKeys as containersQueryKeys } from '@/react/docker/containers/queries/query-keys';
import { ContainerListViewModel } from '@/react/docker/containers/types';
import { SWARM_STACK_NAME_LABEL } from '@/react/constants';

import { associateContainerToTask } from '../../tasks/utils';
import { associateServiceTasks } from '../../services/utils';

export function useSwarmStackResources(
  stackName: string,
  { enabled }: { enabled?: boolean } = {}
) {
  const queryClient = useQueryClient();
  const environmentId = useEnvironmentId();
  const isAgentQuery = useEnvironment(environmentId, (env) =>
    isAgentEnvironment(env.Type)
  );
  const stackFilter = {
    label: [`${SWARM_STACK_NAME_LABEL}=${stackName}`],
  };

  const isAgent = isAgentQuery.data || false;
  const servicesQuery = useServices(
    { environmentId, filters: stackFilter },
    {
      enabled,
      select: (services) => services.map((s) => new ServiceViewModel(s)),
    }
  );
  const tasksQuery = useTasks(
    {
      environmentId,
      filters: stackFilter,
    },
    { enabled, select: (tasks) => tasks.map((t) => new TaskViewModel(t)) }
  );
  const containersQuery = useContainers(environmentId, {
    enabled: enabled && isAgent,
  });

  const containerQueryIsLoading = isAgent && containersQuery.isLoading;

  if (!servicesQuery.data || !tasksQuery.data || containerQueryIsLoading) {
    return {
      data: undefined,
      isLoading: true,
    };
  }

  const containers =
    isAgent && containersQuery.data ? containersQuery.data : [];

  const data = assignSwarmStackResources({
    services: servicesQuery.data,
    tasks: tasksQuery.data,
    isAgent,
    containers,
  });

  return {
    data,
    isLoading: false,
    refetch: () =>
      Promise.all(
        _.compact([
          queryClient.invalidateQueries(servicesQueryKeys.list(environmentId)),
          queryClient.invalidateQueries(tasksQueryKeys.list(environmentId)),
          isAgent &&
            queryClient.invalidateQueries(
              containersQueryKeys.list(environmentId)
            ),
        ])
      ),
  };
}

function assignSwarmStackResources({
  services,
  tasks,
  isAgent,
  containers,
}: {
  services: ServiceViewModel[];
  tasks: TaskViewModel[];
  isAgent: boolean;
  containers: ContainerListViewModel[];
}) {
  const associatedTasks = isAgent
    ? tasks.map((task) => associateContainerToTask(task, containers))
    : tasks;

  return services.map((service) => {
    const serviceTasks = associateServiceTasks(service, associatedTasks);
    return {
      ...service,
      Tasks: serviceTasks,
    };
  });
}
