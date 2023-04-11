import axios from 'axios';
import { useQuery } from 'react-query';

import { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildAgentUrl } from './build-url';

interface Node {
  IPAddress: string;
  NodeName: string;
  NodeRole: string;
}

export function useAgentNodes<T = Array<Node>>(
  environmentId: EnvironmentId,
  apiVersion: number,
  {
    select,
    onSuccess,
    enabled,
  }: {
    select?: (data: Array<Node>) => T;
    onSuccess?: (data: T) => void;
    enabled?: boolean;
  } = {}
) {
  return useQuery(
    ['environment', environmentId, 'agent', 'nodes'],
    () => getNodes(environmentId, apiVersion),
    {
      select,
      onSuccess,
      enabled,
    }
  );
}

async function getNodes(environmentId: EnvironmentId, apiVersion: number) {
  try {
    const response = await axios.get<Array<Node>>(
      buildAgentUrl(environmentId, apiVersion, 'agents')
    );
    return response.data;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve nodes');
  }
}
