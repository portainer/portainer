import { useQuery } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeJob } from '../types';

import { buildUrl } from './build-url';
import { queryKeys } from './query-keys';

export interface EdgeJobResponse extends Omit<EdgeJob, 'Endpoints'> {
  Endpoints: Array<EnvironmentId>;
}

async function getEdgeJobFile(id: EdgeJobResponse['Id']) {
  try {
    const { data } = await axios.get<{ FileContent: string }>(
      buildUrl({ id, action: 'file' })
    );
    return data.FileContent;
  } catch (err) {
    throw parseAxiosError(err, 'Failed fetching edge job file');
  }
}

export function useEdgeJobFile(id: EdgeJobResponse['Id']) {
  return useQuery(queryKeys.file(id), () => getEdgeJobFile(id));
}
