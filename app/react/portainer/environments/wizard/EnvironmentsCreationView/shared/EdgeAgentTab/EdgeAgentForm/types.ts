import { EdgeAsyncIntervalsValues } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { Gpu } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/GpusList';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;

  portainerUrl: string;
  tunnelServerAddr?: string;
  pollFrequency: number;
  meta: EnvironmentMetadata;
  gpus: Gpu[];

  edge: EdgeAsyncIntervalsValues;
}
