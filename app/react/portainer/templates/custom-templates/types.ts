import { UserId } from '@/portainer/users/types';
import { StackType } from '@/react/common/stacks/types';
import {
  StaggerConfig,
  getDefaultStaggerConfig,
} from '@/react/edge/edge-stacks/components/StaggerFieldset.types';

import { ResourceControlResponse } from '../../access-control/types';
import { RelativePathModel, RepoConfigResponse } from '../../gitops/types';
import { VariableDefinition } from '../../custom-templates/components/CustomTemplatesVariablesDefinitionField';
import { Platform } from '../types';
import { RegistryId } from '../../registries/types/registry';
import { getDefaultRelativePathModel } from '../../gitops/RelativePathFieldset/types';
import { isBE } from '../../feature-flags/feature-flags.service';

export type CustomTemplate = {
  Id: number;

  /**
   * Title of the template.
   * @example "Nginx"
   */
  Title: string;

  /**
   * Description of the template.
   * @example "High performance web server"
   */
  Description: string;

  /**
   * Path on disk to the repository hosting the Stack file.
   * @example "/data/custom_template/3"
   */
  ProjectPath: string;

  /**
   * Path to the Stack file.
   * @example "docker-compose.yml"
   */
  EntryPoint: string;

  /**
   * User identifier who created this template.
   * @example 3
   */
  CreatedByUserId: UserId;

  /**
   * A note that will be displayed in the UI. Supports HTML content.
   * @example "This is my <b>custom</b> template"
   */
  Note: string;

  /**
   * Platform associated with the template.
   * Valid values are: 1 - 'linux', 2 - 'windows'.
   * @example 1
   */
  Platform: Platform;

  /**
   * URL of the template's logo.
   * @example "https://portainer.io/img/logo.svg"
   */
  Logo: string;

  /**
   * Type of created stack:
   * - 1: swarm
   * - 2: compose
   * - 3: kubernetes
   * @example 1
   */
  Type: StackType;

  /**
   * ResourceControl associated with the template.
   */
  ResourceControl?: ResourceControlResponse;

  Variables: VariableDefinition[];

  /**
   * GitConfig for the template.
   */
  GitConfig?: RepoConfigResponse;

  /**
   * Indicates if the Kubernetes template is created from a Docker Compose file.
   * @example false
   */
  IsComposeFormat: boolean;

  /** EdgeTemplate indicates if this template purpose for Edge Stack */
  EdgeTemplate: boolean;

  EdgeSettings?: EdgeTemplateSettings;
};

/**
 * EdgeTemplateSettings represents the configuration of a custom template for Edge
 */
export type EdgeTemplateSettings = {
  PrePullImage: boolean;

  RetryDeploy: boolean;

  PrivateRegistryId: RegistryId | undefined;

  RelativePathSettings: RelativePathModel;

  /**
   * StaggerConfig is the configuration for staggered update
   * required only on BE
   */
  StaggerConfig: StaggerConfig;
};

export type CustomTemplateFileContent = {
  FileContent: string;
};

export const CustomTemplateKubernetesType = StackType.Kubernetes;

export function getDefaultEdgeTemplateSettings():
  | EdgeTemplateSettings
  | undefined {
  if (!isBE) {
    return undefined;
  }

  return {
    PrePullImage: false,
    RetryDeploy: false,
    PrivateRegistryId: undefined,
    RelativePathSettings: getDefaultRelativePathModel(),
    StaggerConfig: getDefaultStaggerConfig(),
  };
}
