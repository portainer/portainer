import { Gpu } from 'Portainer/views/endpoints/edit/GpusList';

import { EnvironmentMetadata } from '@/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;
  socketPath: string;
  overridePath: boolean;
  meta: EnvironmentMetadata;
  gpus: Gpu[];
}
