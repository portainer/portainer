import {
  DaemonSet,
  DaemonSetList,
  Deployment,
  DeploymentList,
  StatefulSet,
  StatefulSetList,
  ReplicaSet,
  ControllerRevision,
} from 'kubernetes-types/apps/v1';
import { Container, Pod, PodList, Volume } from 'kubernetes-types/core/v1';
import { RawExtension } from 'kubernetes-types/runtime';
import { OwnerReference } from 'kubernetes-types/meta/v1';

import { EnvVarValues } from '@@/form-components/EnvironmentVariablesFieldset';

import { Annotation } from '../annotations/types';
import { Ingress } from '../ingresses/types';

import { AutoScalingFormValues } from './components/AutoScalingFormSection/types';
import { ServiceFormValues } from './CreateView/application-services/types';
import { PersistedFolderFormValue } from './components/PersistedFoldersFormSection/types';
import { ConfigurationFormValues } from './components/ConfigurationsFormSection/types';
import {
  Placement,
  PlacementType,
} from './components/PlacementFormSection/types';

export type ApplicationFormValues = {
  Containers: Array<unknown>;
  ApplicationType: AppKind;
  ResourcePool: unknown;
  Name: string;
  StackName?: string;
  ApplicationOwner?: string;
  ImageModel: unknown;
  Note?: string;
  MemoryLimit?: number;
  CpuLimit?: number;
  DeploymentType?: DeploymentType;
  ReplicaCount?: number;
  AutoScaler?: AutoScalingFormValues;
  Services?: Array<ServiceFormValues>;
  OriginalIngresses?: Array<Ingress>;
  EnvironmentVariables?: EnvVarValues;
  DataAccessPolicy?: AppDataAccessPolicy;
  PersistedFolders?: Array<PersistedFolderFormValue>;
  ConfigMaps?: Array<ConfigurationFormValues>;
  Secrets?: Array<ConfigurationFormValues>;
  PlacementType?: PlacementType;
  Placements?: Array<Placement>;
  Annotations?: Array<Annotation>;
};

export type Application = Deployment | DaemonSet | StatefulSet | Pod;

// Revisions are have the previous application state and are used for rolling back applications to their previous state.
// Deployments use ReplicaSets, StatefulSets and DaemonSets use ControllerRevisions, and Pods don't have revisions.
export type Revision = ReplicaSet | ControllerRevision;

export type ApplicationList =
  | DeploymentList
  | DaemonSetList
  | StatefulSetList
  | PodList;

export type AppKind = 'Deployment' | 'DaemonSet' | 'StatefulSet' | 'Pod';

export type AppType = AppKind | 'Helm';

export type DeploymentType = 'Replicated' | 'Global';

export type AppDataAccessPolicy = 'Isolated' | 'Shared';

type Patch = {
  op: 'replace' | 'add' | 'remove';
  path: string;
  value: string | number | boolean | null | Record<string, unknown>;
}[];

export type ApplicationPatch = Patch | RawExtension;

export interface ConfigmapRef {
  name: string;
}

export interface ValueFrom {
  configMapRef?: ConfigmapRef;
  secretRef?: ConfigmapRef;
}

export interface Job {
  name?: string;
  namespace: string;
  creationDate?: string;
  uid?: string;
  containers: Container[];
}

export interface K8sPod extends Job {
  ownerReferences: OwnerReference[];
  volumes?: Volume[];
  nodeName?: string;
}

export interface CronJob extends Job {
  schedule: string;
}
