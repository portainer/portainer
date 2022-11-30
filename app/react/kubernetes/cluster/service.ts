import PortainerError from '@/portainer/error';
import axios from '@/portainer/services/axios';
import { EnvironmentId } from '@/react/portainer/environments/types';

// allowedOnly set to true will hide globally disallowed ingresscontrollers
export async function getIsRBACEnabled(environmentId: EnvironmentId) {
  try {
    const { data } = await axios.get(
      `kubernetes/${environmentId}/rbac_enabled`
    );
    // if an api name is rbac.authorization.k8s.io, then rbac is enabled in the cluster
    return data;
  } catch (e) {
    throw new PortainerError('Unable to check if RBAC is enabled.', e as Error);
  }
}
