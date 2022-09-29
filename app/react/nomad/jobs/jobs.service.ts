import axios, { parseAxiosError } from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

export async function deleteJob(
  environmentId: EnvironmentId,
  jobId: string,
  namespace: string
) {
  try {
    await axios.delete(`/nomad/endpoints/${environmentId}/jobs/${jobId}`, {
      params: { namespace },
    });
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
