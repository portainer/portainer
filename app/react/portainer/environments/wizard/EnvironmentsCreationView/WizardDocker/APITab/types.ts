import { EnvironmentMetadata } from '@/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;
  url: string;
  tls: boolean;
  skipVerify?: boolean;
  caCertFile?: File;
  certFile?: File;
  keyFile?: File;
  meta: EnvironmentMetadata;
}
