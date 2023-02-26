import { EdgeGroup } from '@/react/edge/edge-groups/types';
import { DeploymentType } from '@/react/edge/edge-stacks/types';

export interface FormValues {
  edgeGroups: EdgeGroup['Id'][];
  deploymentType: DeploymentType;
  privateRegistryId?: number;
  content: string;
  useManifestNamespaces: boolean;
  prePullImage: boolean;
  retryDeploy: boolean;
  webhookEnabled: boolean;
}
