import {
  EndpointPortConfig,
  HealthConfig,
  Mount,
  Platform,
  Service,
  ServiceSpec,
  TaskSpec,
} from 'docker-types/generated/1.41';

import { ResourceControlViewModel } from '@/react/portainer/access-control/models/ResourceControlViewModel';
import { PortainerResponse } from '@/react/docker/types';

import { TaskViewModel } from './task';

type ContainerSpec = Required<TaskSpec>['ContainerSpec'];

export type ServiceId = string;

export class ServiceViewModel {
  Model: Service;

  Id: string;

  Tasks: TaskViewModel[];

  Name: string;

  CreatedAt: string | undefined;

  UpdatedAt: string | undefined;

  Image: string | undefined;

  Version: number | undefined;

  Mode: string;

  Replicas: number | undefined;

  Running?: number;

  LimitNanoCPUs: number | undefined;

  LimitMemoryBytes: number | undefined;

  ReservationNanoCPUs: number | undefined;

  ReservationMemoryBytes: number | undefined;

  RestartCondition: string;

  RestartDelay: number;

  RestartMaxAttempts: number;

  RestartWindow: number;

  LogDriverName: string;

  LogDriverOpts: never[] | Record<string, string>;

  Constraints: string[];

  Preferences: {
    Spread?: { SpreadDescriptor?: string | undefined } | undefined;
  }[];

  Platforms?: Array<Platform>;

  Labels: Record<string, string> | undefined;

  StackName?: string;

  ContainerLabels: Record<string, string> | undefined;

  Command: string[] | undefined;

  Arguments: string[] | undefined;

  Hostname: string | undefined;

  Env: string[] | undefined;

  Dir: string | undefined;

  User: string | undefined;

  Groups: string[] | undefined;

  TTY: boolean | undefined;

  OpenStdin: boolean | undefined;

  ReadOnly: boolean | undefined;

  Mounts?: Array<Mount>;

  StopSignal: string | undefined;

  StopGracePeriod: number | undefined;

  HealthCheck?: HealthConfig;

  Hosts: string[] | undefined;

  DNSConfig?: ContainerSpec['DNSConfig'];

  Secrets?: ContainerSpec['Secrets'];

  Configs: ContainerSpec['Configs'];

  Ports?: Array<EndpointPortConfig>;

  LogDriver: TaskSpec['LogDriver'];

  Runtime: string | undefined;

  VirtualIPs:
    | { NetworkID?: string | undefined; Addr?: string | undefined }[]
    | undefined;

  UpdateParallelism: number;

  UpdateDelay: number;

  UpdateFailureAction: string;

  UpdateOrder: string;

  RollbackConfig: ServiceSpec['RollbackConfig'];

  Checked: boolean;

  Scale: boolean;

  EditName: boolean;

  ResourceControl?: ResourceControlViewModel;

  constructor(data: PortainerResponse<Service>) {
    this.Model = data;
    this.Id = data.ID || '';
    this.Tasks = [];
    this.Name = data.Spec?.Name || '';
    this.CreatedAt = data.CreatedAt;
    this.UpdatedAt = data.UpdatedAt;
    this.Image = data.Spec?.TaskTemplate?.ContainerSpec?.Image;
    this.Version = data.Version?.Index;
    if (data.Spec?.Mode?.Replicated) {
      this.Mode = 'replicated';
      this.Replicas = data.Spec.Mode.Replicated.Replicas;
    } else {
      this.Mode = 'global';
    }

    if (data.Spec?.TaskTemplate?.Resources) {
      if (data.Spec.TaskTemplate.Resources.Limits) {
        this.LimitNanoCPUs = data.Spec.TaskTemplate.Resources.Limits.NanoCPUs;
        this.LimitMemoryBytes =
          data.Spec.TaskTemplate.Resources.Limits.MemoryBytes;
      }
      if (data.Spec.TaskTemplate.Resources.Reservations) {
        this.ReservationNanoCPUs =
          data.Spec.TaskTemplate.Resources.Reservations.NanoCPUs;
        this.ReservationMemoryBytes =
          data.Spec.TaskTemplate.Resources.Reservations.MemoryBytes;
      }
    }

    if (data.Spec?.TaskTemplate?.RestartPolicy) {
      this.RestartCondition =
        data.Spec.TaskTemplate.RestartPolicy.Condition || 'any';
      this.RestartDelay =
        data.Spec.TaskTemplate.RestartPolicy.Delay || 5000000000;
      this.RestartMaxAttempts =
        data.Spec.TaskTemplate.RestartPolicy.MaxAttempts || 0;
      this.RestartWindow = data.Spec.TaskTemplate.RestartPolicy.Window || 0;
    } else {
      this.RestartCondition = 'any';
      this.RestartDelay = 5000000000;
      this.RestartMaxAttempts = 0;
      this.RestartWindow = 0;
    }

    if (data.Spec?.TaskTemplate?.LogDriver) {
      this.LogDriverName = data.Spec.TaskTemplate.LogDriver.Name || '';
      this.LogDriverOpts = data.Spec.TaskTemplate.LogDriver.Options || [];
    } else {
      this.LogDriverName = '';
      this.LogDriverOpts = [];
    }

    this.Constraints = data.Spec?.TaskTemplate?.Placement
      ? data.Spec.TaskTemplate.Placement.Constraints || []
      : [];
    this.Preferences = data.Spec?.TaskTemplate?.Placement
      ? data.Spec.TaskTemplate.Placement.Preferences || []
      : [];
    this.Platforms = data.Spec?.TaskTemplate?.Placement?.Platforms || [];
    this.Labels = data.Spec?.Labels;
    if (this.Labels && this.Labels['com.docker.stack.namespace']) {
      this.StackName = this.Labels['com.docker.stack.namespace'];
    }

    const containerSpec = data.Spec?.TaskTemplate?.ContainerSpec;
    if (containerSpec) {
      this.ContainerLabels = containerSpec.Labels;
      this.Command = containerSpec.Command;
      this.Arguments = containerSpec.Args;
      this.Hostname = containerSpec.Hostname;
      this.Env = containerSpec.Env;
      this.Dir = containerSpec.Dir;
      this.User = containerSpec.User;
      this.Groups = containerSpec.Groups;
      this.TTY = containerSpec.TTY;
      this.OpenStdin = containerSpec.OpenStdin;
      this.ReadOnly = containerSpec.ReadOnly;
      this.Mounts = containerSpec.Mounts || [];
      this.StopSignal = containerSpec.StopSignal;
      this.StopGracePeriod = containerSpec.StopGracePeriod;
      this.HealthCheck = containerSpec.HealthCheck || {};
      this.Hosts = containerSpec.Hosts;
      this.DNSConfig = containerSpec.DNSConfig;
      this.Secrets = containerSpec.Secrets;
      this.Configs = containerSpec.Configs;
    }
    if (data.Endpoint) {
      this.Ports = data.Endpoint.Ports;
    }

    this.LogDriver = data.Spec?.TaskTemplate?.LogDriver;
    this.Runtime = data.Spec?.TaskTemplate?.Runtime;

    this.VirtualIPs = data.Endpoint ? data.Endpoint.VirtualIPs : [];

    if (data.Spec?.UpdateConfig) {
      this.UpdateParallelism =
        typeof data.Spec.UpdateConfig.Parallelism !== 'undefined'
          ? data.Spec.UpdateConfig.Parallelism || 0
          : 1;
      this.UpdateDelay = data.Spec.UpdateConfig.Delay || 0;
      this.UpdateFailureAction =
        data.Spec.UpdateConfig.FailureAction || 'pause';
      this.UpdateOrder = data.Spec.UpdateConfig.Order || 'stop-first';
    } else {
      this.UpdateParallelism = 1;
      this.UpdateDelay = 0;
      this.UpdateFailureAction = 'pause';
      this.UpdateOrder = 'stop-first';
    }

    this.RollbackConfig = data.Spec?.RollbackConfig;

    this.Checked = false;
    this.Scale = false;
    this.EditName = false;

    if (data.Portainer) {
      if (data.Portainer.ResourceControl) {
        this.ResourceControl = new ResourceControlViewModel(
          data.Portainer.ResourceControl
        );
      }
    }
  }
}
