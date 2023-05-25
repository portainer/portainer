import {
  DaemonSet,
  DaemonSetList,
  Deployment,
  DeploymentList,
  StatefulSet,
  StatefulSetList,
} from 'kubernetes-types/apps/v1';
import { Pod, PodList } from 'kubernetes-types/core/v1';

export type Application = Deployment | DaemonSet | StatefulSet | Pod;

export type ApplicationList =
  | DeploymentList
  | DaemonSetList
  | StatefulSetList
  | PodList;

export type AppKind = 'Deployment' | 'DaemonSet' | 'StatefulSet' | 'Pod';

export type DeploymentType = 'Replicated' | 'Global';
