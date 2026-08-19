import { TLSConfig } from '@/react/components/TLSFieldset/types';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface GeneralEnvironmentFormValues {
  name: string;
  environmentUrl: string;
  publicUrl: string;

  tls?: TLSConfig;

  meta: EnvironmentMetadata;
}
