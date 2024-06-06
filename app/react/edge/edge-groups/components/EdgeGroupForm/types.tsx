import { EnvironmentId } from '@/react/portainer/environments/types';
import { TagId } from '@/portainer/tags/types';

export interface FormValues {
  name: string;
  dynamic: boolean;
  environmentIds: EnvironmentId[];
  partialMatch: boolean;
  tagIds: TagId[];
}
