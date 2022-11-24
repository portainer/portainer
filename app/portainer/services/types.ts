import { Environment } from '@/react/portainer/environments/types';

export interface StateManager {
  updateEndpointState(endpoint: Environment): Promise<void>;
}
