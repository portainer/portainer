import { EndpointSettings } from 'docker-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { queryKeys as containerQueryKeys } from '../../containers/queries/query-keys';
import { withAgentTargetHeader } from '../../proxy/queries/utils';
import { buildDockerProxyUrl } from '../../proxy/queries/buildDockerProxyUrl';

interface ConnectContainerPayload {
  Container: string;
  EndpointConfig?: EndpointSettings;
}

export function useConnectContainerMutation(environmentId: EnvironmentId) {
  const queryClient = useQueryClient();

  return useMutation(
    (params: Omit<ConnectContainer, 'environmentId'>) =>
      connectContainer({ ...params, environmentId }),
    mutationOptions(
      withError('Failed connecting container to network'),
      withInvalidate(queryClient, [containerQueryKeys.list(environmentId)])
    )
  );
}

interface ConnectContainer {
  environmentId: EnvironmentId;
  networkId: string;
  containerId: string;
  aliases?: EndpointSettings['Aliases'];
  nodeName?: string;
}

/**
 * Raw docker API proxy
 */
export async function connectContainer({
  environmentId,
  containerId,
  networkId,
  aliases,
  nodeName,
}: ConnectContainer) {
  const payload: ConnectContainerPayload = {
    Container: containerId,
  };
  if (aliases) {
    payload.EndpointConfig = {
      Aliases: aliases,
    };
  }

  try {
    await axios.post(
      buildDockerProxyUrl(environmentId, 'networks', networkId, 'connect'),
      payload,
      { headers: { ...withAgentTargetHeader(nodeName) } }
    );
  } catch (err) {
    throw parseAxiosError(err, 'Unable to connect container');
  }
}
