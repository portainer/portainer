import { RestartPolicy } from 'docker-types/generated/1.41';

import { BasicTableSettings } from '@@/datatables/types';

import { Pair } from '../../settings/types';

export interface ListState extends BasicTableSettings {
  category: string | null;
  setCategory: (category: string | null) => void;
  types: ReadonlyArray<TemplateType>;
  setTypes: (value: ReadonlyArray<TemplateType>) => void;
}

export enum TemplateType {
  Container = 1,
  SwarmStack = 2,
  ComposeStack = 3,
}

/**
 * Template represents an application template that can be used as an App Template or an Edge template.
 */
export interface AppTemplate {
  /**
   * Unique identifier of the template.
   */
  id: number;

  /**
   * Template type. Valid values are: 1 (container), 2 (Swarm stack), 3 (Compose stack)
   * @example 1
   */
  type: TemplateType;

  /**
   * Title of the template.
   * @example "Nginx"
   */
  title: string;

  /**
   * Description of the template.
   * @example "High performance web server"
   */
  description: string;

  /**
   * Whether the template should be available to administrators only.
   * @example true
   */
  administrator_only: boolean;

  /**
   * Image associated with a container template. Mandatory for a container template.
   * @example "nginx:latest"
   */
  image: string;

  /**
   * Repository associated with the template.
   */
  repository: TemplateRepository;

  /**
   * Stack file used for this template (Mandatory for Edge stack).
   */
  stackFile?: string;

  /**
   * Default name for the stack/container to be used on deployment.
   * @example "mystackname"
   */
  name?: string;

  /**
   * URL of the template's logo.
   * @example "https://portainer.io/img/logo.svg"
   */
  logo?: string;

  /**
   * A list of environment (endpoint) variables used during the template deployment.
   */
  env?: TemplateEnv[];

  /**
   * A note that will be displayed in the UI. Supports HTML content.
   * @example "This is my <b>custom</b> template"
   */
  note?: string;

  /**
   * Platform associated with the template.
   * Valid values are: 'linux', 'windows' or leave empty for multi-platform.
   * @example "linux"
   */
  platform?: 'linux' | 'windows' | '';

  /**
   * A list of categories associated with the template.
   * @example ["database"]
   */
  categories?: string[];

  /**
   * The URL of a registry associated with the image for a container template.
   * @example "quay.io"
   */
  registry?: string;

  /**
   * The command that will be executed in a container template.
   * @example "ls -lah"
   */
  command?: string;

  /**
   * Name of a network that will be used on container deployment if it exists inside the environment (endpoint).
   * @example "mynet"
   */
  network?: string;

  /**
   * A list of volumes used during the container template deployment.
   */
  volumes?: TemplateVolume[];

  /**
   * A list of ports exposed by the container.
   * @example ["8080:80/tcp"]
   */
  ports?: string[];

  /**
   * Container labels.
   */
  labels?: Pair[];

  hosts?: string[];

  /**
   * Whether the container should be started in privileged mode.
   * @example true
   */
  privileged?: boolean;

  /**
   * Whether the container should be started in interactive mode (-i -t equivalent on the CLI).
   * @example true
   */
  interactive?: boolean;

  /**
   * Container restart policy.
   * @example "on-failure"
   */
  restart_policy?: RestartPolicy['Name'];

  /**
   * Container hostname.
   * @example "mycontainer"
   */
  hostname?: string;
}

/**
 * TemplateRepository represents the git repository configuration for a template.
 */
export interface TemplateRepository {
  /**
   * URL of a git repository used to deploy a stack template. Mandatory for a Swarm/Compose stack template.
   * @example "https://github.com/portainer/portainer-compose"
   */
  url: string;

  /**
   * Path to the stack file inside the git repository.
   * @example "./subfolder/docker-compose.yml"
   */
  stackfile: string;
}

/**
 * TemplateVolume represents a template volume configuration.
 */
export interface TemplateVolume {
  /**
   * Path inside the container.
   * @example "/data"
   */
  container: string;

  /**
   * Path on the host.
   * @example "/tmp"
   */
  bind?: string;

  /**
   * Whether the volume used should be readonly.
   * @example true
   */
  readonly?: boolean;
}

/**
 * TemplateEnv represents an environment (endpoint) variable for a template.
 */
export interface TemplateEnv {
  /**
   * Name of the environment (endpoint) variable.
   * @example "MYSQL_ROOT_PASSWORD"
   */
  name: string;

  /**
   * Text for the label that will be generated in the UI.
   * @example "Root password"
   */
  label?: string;

  /**
   * Content of the tooltip that will be generated in the UI.
   * @example "MySQL root account password"
   */
  description?: string;

  /**
   * Default value that will be set for the variable.
   * @example "default_value"
   */
  default?: string;

  /**
   * If set to true, will not generate any input for this variable in the UI.
   * @example false
   */
  preset?: boolean;

  /**
   * A list of name/value pairs that will be used to generate a dropdown in the UI.
   */
  select?: TemplateEnvSelect[];
}

/**
 * TemplateEnvSelect represents a text/value pair that will be displayed as a choice for the template user.
 */
interface TemplateEnvSelect {
  /**
   * Some text that will be displayed as a choice.
   * @example "text value"
   */
  text: string;

  /**
   * A value that will be associated with the choice.
   * @example "value"
   */
  value: string;

  /**
   * Will set this choice as the default choice.
   * @example false
   */
  default: boolean;
}
