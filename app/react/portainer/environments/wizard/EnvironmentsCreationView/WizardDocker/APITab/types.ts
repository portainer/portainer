import { TLSConfig } from '@/react/components/TLSFieldset/types';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;
  url: string;
  tlsConfig: TLSConfig;
  meta: EnvironmentMetadata;
}
