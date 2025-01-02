import { RegistryId } from '@/react/portainer/registries/types/registry';
import {
  GitFormModel,
  RelativePathModel,
} from '@/react/portainer/gitops/types';

import { EnvVarValues } from '@@/form-components/EnvironmentVariablesFieldset';

import { EdgeGroup } from '../../edge-groups/types';
import { DeploymentType, StaggerConfig } from '../types';

import { KubeFormValues } from './KubeManifestForm';
import { Values as TemplateFieldsetValues } from './TemplateFieldset/types';

export type Method = 'editor' | 'upload' | 'repository' | 'template';

export interface DockerFormValues {
  method: Method;
  fileContent: string;
  file?: File;
  templateValues: TemplateFieldsetValues;
  git: GitFormModel;
  relativePath: RelativePathModel;
}

export interface FormValues extends KubeFormValues, DockerFormValues {
  method: Method;
  name: string;
  groupIds: Array<EdgeGroup['Id']>;
  deploymentType: DeploymentType;
  envVars: EnvVarValues;
  privateRegistryId: RegistryId;
  prePullImage: boolean;
  retryDeploy: boolean;
  enableWebhook: boolean;
  staggerConfig: StaggerConfig;
}
