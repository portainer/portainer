import { useQuery } from 'react-query';

import axios, { parseAxiosError } from '../axios';

export interface NodesCountResponse {
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
  Edition: string;
  Version: string;
  InstanceID: string;
}

export async function getStatus() {
  try {
    const { data } = await axios.get<StatusResponse>(buildUrl());

    data.Edition = 'Community Edition';

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

export interface VersionResponse {
  // Whether portainer has an update available
  UpdateAvailable: boolean;
  // The latest version available
  LatestVersion: string;
  ServerVersion: string;
  DatabaseVersion: string;
  Build: {
    BuildNumber: string;
    ImageTag: string;
    NodejsVersion: string;
    YarnVersion: string;
    WebpackVersion: string;
    GoVersion: string;
  };
}

export async function getVersionStatus() {
  try {
    const { data } = await axios.get<VersionResponse>(buildUrl('version'));
    return data;
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}

export function useVersionStatus() {
  return useQuery(['version'], () => getVersionStatus());
}

function buildUrl(action?: string) {
  let url = '/status';

  if (action) {
    url += `/${action}`;
  }

  return url;
}
