import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '../axios';

interface NodesCountResponse {
  nodes: number;
}

export async function getNodesCount() {
  try {
    const { data } = await axios.get<NodesCountResponse>(buildUrl('nodes'));
    return data.nodes;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export interface StatusResponse {
  Version: string;
  InstanceID: string;
}

export async function getStatus() {
  try {
    const { data } = await axios.get<StatusResponse>(buildUrl());

    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useStatus<T = StatusResponse>(
  select?: (status: StatusResponse) => T
) {
  return useQuery(['status'], () => getStatus(), { select });
}

function buildUrl(action?: string) {
  let url = '/status';

  if (action) {
    url += `/${action}`;
  }

  return url;
}
