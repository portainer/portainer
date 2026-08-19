import { UserId } from '@/portainer/users/types';

export interface FormValues {
  name: string;
  leaders: UserId[];
}
