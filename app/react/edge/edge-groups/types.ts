import { EnvironmentId } from '@/react/portainer/environments/types';
import { TagId } from '@/portainer/tags/types';

export interface EdgeGroup {
  Id: number;
  Name: string;
  Dynamic: boolean;
  TagIds: TagId[];
  Endpoints: EnvironmentId[];
  PartialMatch: boolean;
}
