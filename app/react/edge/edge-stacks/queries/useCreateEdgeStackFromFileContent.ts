import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError, withInvalidate } from '@/react-tools/react-query';
import { RegistryId } from '@/react/portainer/registries/types';

import { EdgeGroup } from '../../edge-groups/types';
import { DeploymentType, EdgeStack } from '../types';

import { buildUrl } from './buildUrl';
import { queryKeys } from './query-keys';

export function useCreateEdgeStackFromFileContent() {
  const queryClient = useQueryClient();

  return useMutation(createEdgeStackFromFileContent, {
    ...withError('Failed creating Edge stack'),
    ...withInvalidate(queryClient, [queryKeys.base()]),
  });
}

interface FileContentPayload {
  name: string;
  stackFileContent: string;
  edgeGroups: EdgeGroup['Id'][];
  deploymentType: DeploymentType;
  registries?: RegistryId[];
  useManifestNamespaces?: boolean;
  prePullImage?: boolean;
  dryRun?: boolean;
}

export async function createEdgeStackFromFileContent({
  dryRun,
  ...payload
}: FileContentPayload) {
  try {
    const { data } = await axios.post<EdgeStack>(
      buildUrl(undefined, 'create/string'),
      payload,
      {
        params: { dryrun: dryRun ? 'true' : 'false' },
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
