import { useQueryClient, useMutation, MutationFunction } from 'react-query';

import {
  createRemoteEnvironment,
  createLocalEnvironment,
  createAzureEnvironment,
  createAgentEnvironment,
  createEdgeAgentEnvironment,
} from '../environment.service/create';

export function useCreateAzureEnvironmentMutation() {
  return useGenericCreationMutation(createAzureEnvironment);
}

export function useCreateLocalEnvironmentMutation() {
  return useGenericCreationMutation(createLocalEnvironment);
}

export function useCreateRemoteEnvironmentMutation(
  creationType: Parameters<typeof createRemoteEnvironment>[0]['creationType']
) {
  return useGenericCreationMutation(
    (
      params: Omit<
        Parameters<typeof createRemoteEnvironment>[0],
        'creationType'
      >
    ) => createRemoteEnvironment({ creationType, ...params })
  );
}

export function useCreateAgentEnvironmentMutation() {
  return useGenericCreationMutation(createAgentEnvironment);
}

export function useCreateEdgeAgentEnvironmentMutation() {
  return useGenericCreationMutation(createEdgeAgentEnvironment);
}

function useGenericCreationMutation<TData = unknown, TVariables = void>(
  mutation: MutationFunction<TData, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation(mutation, {
    onSuccess() {
      return queryClient.invalidateQueries(['environments']);
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to create environment',
      },
    },
  });
}
