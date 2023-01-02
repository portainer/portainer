import PortainerError from '@/portainer/error';
import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

export async function getIsRBACEnabled(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get<boolean>(
      `kubernetes/${environmentId}/rbac_enabled`
    );
    return data;
  } catch (e) {
    throw new PortainerError('Unable to check if RBAC is enabled.', e as Error);
  }
}
