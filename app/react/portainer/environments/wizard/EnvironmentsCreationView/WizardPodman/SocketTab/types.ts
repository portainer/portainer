import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;
  socketPath: string;
  overridePath: boolean;
  meta: EnvironmentMetadata;
}
