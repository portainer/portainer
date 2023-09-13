import { useMutation } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError } from '@/react-tools/react-query';
import { RegistryId } from '@/react/portainer/registries/types';

import { EdgeGroup } from '../../edge-groups/types';
import { DeploymentType, EdgeStack } from '../types';

import { buildUrl } from './buildUrl';

export function useCreateStackFromFileContent() {
  return useMutation(createStackFromFileContent, {
    ...withError('Failed creating Edge stack'),
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

export async function createStackFromFileContent({
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
