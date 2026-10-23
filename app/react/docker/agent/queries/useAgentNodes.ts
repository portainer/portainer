import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildAgentUrl } from './build-url';

export interface AgentNode {
  IPAddress: string;
  NodeName: string;
  NodeRole: string;
}

export function useAgentNodes<T = Array<AgentNode>>(
  environmentId: EnvironmentId,
  apiVersion: number,
  {
    select,
    enabled,
  }: {
    select?: (data: Array<AgentNode>) => T;
    enabled?: boolean;
  } = {}
) {
  return useQuery(
    ['environment', environmentId, 'agent', 'nodes'],
    () => getNodes(environmentId, apiVersion),
    {
      select,
      enabled,
    }
  );
}

async function getNodes(environmentId: EnvironmentId, apiVersion: number) {
  try {
    const response = await axios.get<Array<AgentNode>>(
      buildAgentUrl(environmentId, apiVersion, 'agents')
    );
    return response.data;
  } catch (error) {
    throw parseAxiosError(error as Error, 'Unable to retrieve nodes');
  }
}
