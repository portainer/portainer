import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { VariablesFieldValue } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesField';

export interface FormValues {
  name: string;
  edgeGroupIds: Array<EdgeGroup['Id']>;
  variables: VariablesFieldValue;
  fileContent: string;
}
