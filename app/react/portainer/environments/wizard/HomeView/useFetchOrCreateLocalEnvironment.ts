import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { useEnvironmentList } from '@/react/portainer/environments/queries/useEnvironmentList';
import {
  Environment,
  EnvironmentType,
} from '@/react/portainer/environments/types';
import {
  createLocalDockerEnvironment,
  createLocalKubernetesEnvironment,
} from '@/react/portainer/environments/environment.service/create';

export function useConnectLocalEnvironment(): {
  status: 'error' | 'loading' | 'success';
  type?: EnvironmentType;
} {
  const [localEnvironment, setLocalEnvironment] = useState<Environment>();

  const { isLoading, environment } = useFetchLocalEnvironment();

  const createLocalEnvironmentMutation = useMutation(createLocalEnvironment);

  const { mutate } = createLocalEnvironmentMutation;

  useEffect(() => {
    if (isLoading || localEnvironment) {
      return;
    }

    if (environment) {
      setLocalEnvironment(environment);
      return;
    }

    mutate(undefined, {
      onSuccess(environment) {
        setLocalEnvironment(environment);
      },
    });
  }, [environment, isLoading, localEnvironment, mutate]);

  return {
    status: getStatus(isLoading, createLocalEnvironmentMutation.status),
    type: localEnvironment?.Type,
  };
}

function getStatus(
  isLoading: boolean,
  mutationStatus: 'loading' | 'error' | 'success' | 'idle'
): 'loading' | 'error' | 'success' {
  if (isLoading || mutationStatus === 'loading') {
    return 'loading';
  }

  if (mutationStatus === 'error') {
    return 'error';
  }

  return 'success';
}

async function createLocalEnvironment() {
  try {
    return await createLocalKubernetesEnvironment({ name: 'local' });
  } catch (err) {
    return await createLocalDockerEnvironment({ name: 'local' });
  }
}

function useFetchLocalEnvironment() {
  const { environments, isLoading } = useEnvironmentList(
    {
      page: 0,
      pageLimit: 1,
      types: [
        EnvironmentType.Docker,
        EnvironmentType.AgentOnDocker,
        EnvironmentType.KubernetesLocal,
      ],
    },
    {
      refetchInterval: false,
      staleTime: Infinity,
    }
  );

  let environment: Environment | undefined;
  environments.forEach((value) => {
    if (!environment) {
      if (value.Type === EnvironmentType.AgentOnDocker) {
        if (value.Name === 'primary' && value.Id === 1) {
          environment = value;
        }
      } else {
        environment = value;
      }
    }
  });

  return {
    isLoading,
    environment,
  };
}
