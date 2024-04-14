import { Node } from 'docker-types/generated/1.41';
import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export function useNodes(environmentId: EnvironmentId) {
  return useQuery(queryKeys.base(environmentId), () => getNodes(environmentId));
}

async function getNodes(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<Array<Node>>(buildUrl(environmentId));
    return data;
  } catch (error) {
    throw parseAxiosError(error, 'Unable to retrieve nodes');
  }
}
