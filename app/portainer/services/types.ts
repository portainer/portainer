import { Environment } from '@/react/portainer/environments/types';

export interface EndpointProvider {
  setEndpointID(id: Environment['Id']): void;
  setEndpointPublicURL(url?: string): void;
  setOfflineModeFromStatus(status: Environment['Status']): void;
  setCurrentEndpoint(endpoint: Environment | undefined): void;
}

export interface StateManager {
  updateEndpointState(endpoint: Environment): Promise<void>;
}
