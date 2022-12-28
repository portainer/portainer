import { Environment } from '@/react/portainer/environments/types';

export type EnvironmentListItem = {
  GroupName?: string;
} & Environment;
