import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

interface LeaderResponse {
  Leader: string;
}

export async function getLeader(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<LeaderResponse>(
      `/nomad/endpoints/${environmentId}/leader`,
      {
        params: {},
      }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
