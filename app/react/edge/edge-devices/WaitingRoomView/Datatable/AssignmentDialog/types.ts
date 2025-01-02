import { TagId } from '@/portainer/tags/types';
import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { EnvironmentGroupId } from '@/react/portainer/environments/types';

export interface FormValues {
  group: EnvironmentGroupId | null;
  overrideGroup: boolean;
  edgeGroups: Array<EdgeGroup['Id']>;
  overrideEdgeGroups: boolean;
  tags: Array<TagId>;
  overrideTags: boolean;
}
