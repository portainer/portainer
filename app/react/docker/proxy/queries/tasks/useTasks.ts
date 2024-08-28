import { Task } from 'docker-types/generated/1.41';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { buildDockerProxyUrl } from '../buildDockerProxyUrl';
import { withFiltersQueryParam } from '../utils';

type Filters = {
  'desired-state'?: 'running' | 'shutdown' | 'accepted';
  id?: Task['ID'];
  label?: Task['Labels'];
  name?: Task['Name'];
  node?: Task['NodeID'];
  service?: Task['ServiceID'];
};

export async function getTasks(
  environmentId: EnvironmentId,
  filters?: Filters
) {
  try {
    const { data } = await axios.get<Task[]>(
      buildDockerProxyUrl(environmentId, 'tasks'),
      {
        params: {
          ...withFiltersQueryParam(filters),
        },
      }
    );
    return data;
  } catch (err) {
    throw parseAxiosError(err, 'Unable to retrieve tasks');
  }
}
