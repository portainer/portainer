import { EndpointSettings } from 'docker-types/generated/1.41';
import { RawAxiosRequestHeaders } from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { queryKeys as dockerQueryKeys } from '../../queries/utils';

import { buildUrl } from './buildUrl';

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
      withInvalidate(queryClient, [dockerQueryKeys.containers(environmentId)])
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

  const headers: RawAxiosRequestHeaders = {};

  if (nodeName) {
    headers['X-PortainerAgent-Target'] = nodeName;
  }

  try {
    await axios.post(
      buildUrl(environmentId, { id: networkId, action: 'connect' }),
      payload
    );
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to connect container');
  }
}
