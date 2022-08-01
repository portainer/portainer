import { Environment } from '../environments/types';

export interface EndpointProvider {
  setEndpointID(id: Environment['Id']): void;
  setEndpointPublicURL(url?: string): void;
  setOfflineModeFromStatus(status: Environment['Status']): void;
}

export interface StateManager {
  updateEndpointState(endpoint: Environment): Promise<void>;
}
