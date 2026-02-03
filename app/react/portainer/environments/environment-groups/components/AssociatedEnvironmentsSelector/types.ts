import { Environment } from '@/react/portainer/environments/types';

export type EnvironmentTableData = Pick<Environment, 'Name' | 'Id'>;
