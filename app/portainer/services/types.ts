import { Environment } from '@/react/portainer/environments/types';

export interface StateManager {
  updateEndpointState(endpoint: Environment): Promise<void>;
}

export interface IAuthenticationService {
  getUserDetails(): { ID: number };
}

export type AsyncService = <T>(fn: () => Promise<T>) => Promise<T>;
