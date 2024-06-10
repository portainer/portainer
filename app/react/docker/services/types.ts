import { ServiceSpec, TaskSpec } from 'docker-types/generated/1.41';

export type ServiceId = string;

export type Filters = {
  id?: ServiceId[];
  label?: string[];
  mode?: ['replicated' | 'global'];
  name?: string[];
};

export interface ServiceUpdateConfig {
  Name: string;
  Labels: Record<string, string>;
  TaskTemplate: TaskSpec;
  Mode: ServiceSpec['Mode'];
  UpdateConfig: ServiceSpec['UpdateConfig'];
  Networks: ServiceSpec['Networks'];
  EndpointSpec: ServiceSpec['EndpointSpec'];
}
