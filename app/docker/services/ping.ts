import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/portainer/environments/types';

export async function ping(environmentId: EnvironmentId) {
  try {
    await axios.get(`/endpoints/${environmentId}/docker/_ping`);
  } catch (error) {
    throw parseAxiosError(error as Error);
  }
}
