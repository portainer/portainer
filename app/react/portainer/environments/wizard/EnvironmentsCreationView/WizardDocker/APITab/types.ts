import { Gpu } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/GpusList';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;
  url: string;
  tls: boolean;
  skipVerify?: boolean;
  caCertFile?: File;
  certFile?: File;
  keyFile?: File;
  meta: EnvironmentMetadata;
  gpus?: Gpu[];
}
