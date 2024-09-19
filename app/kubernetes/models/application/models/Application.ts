import { ServiceType } from '@/react/kubernetes/applications/CreateView/application-services/types';
import {
  AppType,
  DeploymentType,
  AppDataAccessPolicy,
  AppKind,
} from '@/react/kubernetes/applications/types';

import { ConfigurationVolume } from './ConfigurationVolume';
import { PersistedFolder } from './PersistedFolder';

export class Application {
  Id: string;

  Name: string;

  StackName: string;

  StackId: string;

  ApplicationKind?: AppKind;

  ApplicationOwner: string;

  ApplicationName: string;

  Annotations: Record<string, string> = {};

  ResourcePool: string;

  Image: string;

  CreationDate: 0;

  Pods: [];

  Containers: [];

  Metadata: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };

  Resource?: {
    cpuLimit?: number;
    cpuRequest?: number;
    memoryLimit?: number;
    memoryRequest?: number;
  };

  ServiceType?: ServiceType;

  ServiceId: string;

  ServiceName: string;

  HeadlessServiceName: undefined; // only used for StatefulSet

  LoadBalancerIPAddress: undefined; // only filled when bound service is LoadBalancer and state is available

  PublishedPorts: [];

  Volumes: [];

  Env: [];

  PersistedFolders: Array<PersistedFolder>;

  ConfigurationVolumes: Array<ConfigurationVolume>;

  DeploymentType?: DeploymentType;

  DataAccessPolicy?: AppDataAccessPolicy;

  ApplicationType?: AppType;

  RunningPodsCount: 0;

  TotalPodsCount: 0;

  Yaml: string;

  Note: string;

  Raw: undefined; // only filled when inspecting app details / create / edit view (never filled in multiple-apps views)

  AutoScaler: undefined; // only filled if the application has an HorizontalPodAutoScaler bound to it

  Conditions: Array<{
    lastTransitionTime: string;
    lastUpdateTime: string;
    message: string;
    reason: string;
    status: string;
    type: string;
  }> = [];

  constructor() {
    this.Id = '';
    this.Name = '';
    this.StackName = '';
    this.StackId = '';
    this.ApplicationOwner = '';
    this.ApplicationName = '';
    this.ResourcePool = '';
    this.Image = '';
    this.CreationDate = 0;
    this.Pods = [];
    this.Containers = [];
    this.Metadata = {};
    this.Resource = {};
    this.ServiceId = '';
    this.ServiceName = '';
    this.HeadlessServiceName = undefined;
    this.LoadBalancerIPAddress = undefined;
    this.PublishedPorts = [];
    this.Volumes = [];
    this.Env = [];
    this.PersistedFolders = [];
    this.ConfigurationVolumes = [];
    this.RunningPodsCount = 0;
    this.TotalPodsCount = 0;
    this.Yaml = '';
    this.Note = '';
    this.Raw = undefined;
    this.AutoScaler = undefined;
  }
}
