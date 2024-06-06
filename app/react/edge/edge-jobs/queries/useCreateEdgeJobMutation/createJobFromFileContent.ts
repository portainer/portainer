import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { EdgeJob } from '../../types';
import { buildUrl } from '../build-url';

/**
 * Payload for creating an EdgeJob from a string
 */
export interface FileContentPayload {
  name: string;
  cronExpression: string;
  recurring: boolean;

  edgeGroups: Array<EdgeGroup['Id']>;
  endpoints: Array<EnvironmentId>;
  fileContent: string;
}

export async function createJobFromFileContent(payload: FileContentPayload) {
  try {
    const { data } = await axios.post<EdgeJob>(
      buildUrl({ action: 'create/string' }),
      payload
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
