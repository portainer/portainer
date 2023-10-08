import { UserId } from '@/portainer/users/types';
import { StackType } from '@/react/common/stacks/types';

import { ResourceControlResponse } from '../access-control/types';
import { RepoConfigResponse } from '../gitops/types';

export enum Platform {
  LINUX = 1,
  WINDOWS,
}

export /**
 * CustomTemplate represents a custom template.
 */
interface CustomTemplate {
  /**
   * CustomTemplate Identifier.
   * @example 1
   */
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

  /**
   * GitConfig for the template.
   */
  GitConfig?: RepoConfigResponse;

  /**
   * Indicates if the Kubernetes template is created from a Docker Compose file.
   * @example false
   */
  IsComposeFormat: boolean;
}

export type CustomTemplateFileContent = {
  FileContent: string;
};

export const CustomTemplateKubernetesType = 3;

export enum Types {
  SWARM = 1,
  STANDALONE,
  KUBERNETES,
}
