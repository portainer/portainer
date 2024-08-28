import { EnvironmentMetadata } from '@/react/portainer/environments/environment.service/create';

export interface FormValues {
  name: string;

  publicUrl: string;

  meta: EnvironmentMetadata;

  checkInInterval: number;
  CommandInterval: number;
  PingInterval: number;
  SnapshotInterval: number;
}
