import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;

  meta: EnvironmentMetadata;

  applicationId: string;
  tenantId: string;
  authKey: string;
}
