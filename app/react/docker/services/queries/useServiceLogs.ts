import _ from 'lodash';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { buildUrl } from '@/react/docker/services/queries/build-url';
import { ServiceId } from '@/react/docker/services/types';

type ServiceLogsParams = {
  stdout?: boolean;
  stderr?: boolean;
  timestamps?: boolean;
  since?: number;
  tail?: number;
};

export async function getServiceLogs(
  environmentId: EnvironmentId,
  serviceId: ServiceId,
  params?: ServiceLogsParams
): Promise<string> {
  try {
    const { data } = await axios.get<string>(
      buildUrl(environmentId, serviceId, 'logs'),
      {
        params: _.pickBy(params),
      }
    );

    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get service logs');
  }
}
