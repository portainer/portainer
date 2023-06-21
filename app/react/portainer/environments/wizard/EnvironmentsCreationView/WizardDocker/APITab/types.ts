import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface TLSConfig {
  tls: boolean;
  skipVerify?: boolean;
  caCertFile?: File;
  certFile?: File;
  keyFile?: File;
}

export interface FormValues {
  name: string;
  url: string;
  tlsConfig: TLSConfig;
  meta: EnvironmentMetadata;
}
