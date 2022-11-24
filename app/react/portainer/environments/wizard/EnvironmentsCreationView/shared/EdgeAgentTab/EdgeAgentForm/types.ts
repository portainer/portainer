import { Gpu } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/GpusList';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;

  portainerUrl: string;
  pollFrequency: number;
  meta: EnvironmentMetadata;
  gpus: Gpu[];
}
