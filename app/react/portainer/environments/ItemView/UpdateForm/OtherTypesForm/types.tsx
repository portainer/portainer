import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

import { TLSConfig } from '@@/TLSFieldset/types';

export interface FormValues {
  name: string;
  url: string;
  publicUrl: string;
  tlsConfig: TLSConfig;
  meta: EnvironmentMetadata;
}
