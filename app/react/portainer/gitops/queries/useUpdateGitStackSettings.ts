import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/react/portainer/services/axios/axios';
import { buildStackUrl } from '@/react/common/stacks/queries/buildUrl';
import { queryKeys } from '@/react/common/stacks/queries/query-keys';
import { withError } from '@/react-tools/react-query';

import { EnvVar } from '@@/form-components/EnvironmentVariablesFieldset/types';

import { AutoUpdateResponse } from '../types';

export interface GitStackPayload {
  env: Array<EnvVar>;
  prune?: boolean;
  RepositoryURL?: string;
  ConfigFilePath?: string;
  RepositoryReferenceName?: string;
  AutoUpdate?: AutoUpdateResponse | null;
  TLSSkipVerify?: boolean;
  Registries?: number[];
  AdditionalFiles?: string[];
  HelmChartPath?: string;
  HelmValuesFiles?: string[];
  Atomic?: boolean;
  SourceID?: number;
}

export async function updateGitStackSettings(
  stackId: number,
  endpointId: number,
  payload: GitStackPayload
) {
  try {
    const { data } = await axios.post(buildStackUrl(stackId, 'git'), payload, {
      params: { endpointId },
    });
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}

export function useUpdateGitStackSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      stackId,
      endpointId,
      payload,
    }: {
      stackId: number;
      endpointId: number;
      payload: GitStackPayload;
    }) => updateGitStackSettings(stackId, endpointId, payload),
    onSuccess: (_, { stackId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.stack(stackId),
        exact: true,
      });
    },
    ...withError('Unable to save stack settings'),
  });
}
