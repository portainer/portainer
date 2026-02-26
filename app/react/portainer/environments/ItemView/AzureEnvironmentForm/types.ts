import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface AzureEnvironmentFormValues {
  name: string;
  environmentUrl: string;
  azure: {
    applicationId: string;
    tenantId: string;
    authenticationKey: string;
  };
  meta: EnvironmentMetadata;
}
