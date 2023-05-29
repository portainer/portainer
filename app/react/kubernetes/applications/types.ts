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
import { Pod, PodList } from 'kubernetes-types/core/v1';
import { RawExtension } from 'kubernetes-types/runtime';

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

export type DeploymentType = 'Replicated' | 'Global';

type Patch = {
  op: 'replace' | 'add' | 'remove';
  path: string;
  value: string | number | boolean | null | Record<string, unknown>;
}[];

export type ApplicationPatch = Patch | RawExtension;
