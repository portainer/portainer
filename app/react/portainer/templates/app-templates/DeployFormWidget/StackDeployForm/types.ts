import { AccessControlFormData } from '@/react/portainer/access-control/types';

export interface FormValues {
  name: string;
  envVars: Record<string, string | undefined>;
  accessControl: AccessControlFormData;
}
