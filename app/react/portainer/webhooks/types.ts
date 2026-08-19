import { EnvironmentId } from '../environments/types';
import { RegistryId } from '../registries/types/registry';

export enum WebhookType {
  DockerService = 1,
  DockerContainer = 2,
}

export interface Webhook {
  Id: number;
  Token: string;
  ResourceId: string;
  EndpointId: EnvironmentId;
  RegistryId: RegistryId;
  Type: WebhookType;
}

export interface Filters {
  endpointId: EnvironmentId;
  resourceId?: string;
}
