import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { Registry } from '@/react/portainer/registries/types/registry';
import { useEnvironmentRegistries } from '@/react/portainer/environments/queries/useEnvironmentRegistries';
import { withInvalidate } from '@/react-tools/react-query';

import { buildImageFullURI } from '../utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';
import {
  withAgentTargetHeader,
  withRegistryAuthHeader,
} from '../../proxy/queries/utils';

import { queryKeys } from './queryKeys';

type UsePullImageMutation = Omit<PullImageOptions, 'registry'> & {
  registryId?: Registry['Id'];
};

export function usePullImageMutation(envId: EnvironmentId) {
  const queryClient = useQueryClient();
  const registriesQuery = useEnvironmentRegistries(envId);

  return useMutation({
    mutationFn: (args: UsePullImageMutation) =>
      pullImage({
        ...args,
        registry: getRegistry(registriesQuery.data || [], args.registryId),
      }),
    ...withInvalidate(queryClient, [queryKeys.base(envId)]),
  });
}

function getRegistry(registries: Registry[], registryId?: Registry['Id']) {
  return registryId
    ? registries.find((registry) => registry.Id === registryId)
    : undefined;
}

interface PullImageOptions {
  environmentId: EnvironmentId;
  image: string;
  nodeName?: string;
  registry?: Registry;
  ignoreErrors: boolean;
}

export async function pullImage({
  environmentId,
  ignoreErrors,
  image,
  nodeName,
  registry,
}: PullImageOptions) {
  const imageURI = buildImageFullURI(image, registry);

  try {
    await axios.post(
      buildDockerProxyUrl(environmentId, 'images', 'create'),
      null,
      {
        params: {
          fromImage: imageURI,
        },
        headers: {
          ...withRegistryAuthHeader(registry?.Id),
          ...withAgentTargetHeader(nodeName),
        },
      }
    );
  } catch (err) {
    if (ignoreErrors) {
      return;
    }

    throw parseAxiosError(err, 'Unable to pull image');
  }
}
