import { EdgeAsyncIntervalsValues } from '@/react/edge/components/EdgeAsyncIntervalsForm';
import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;

  portainerUrl: string;
  tunnelServerAddr?: string;
  pollFrequency: number;
  meta: EnvironmentMetadata;

  edge: EdgeAsyncIntervalsValues;
}
