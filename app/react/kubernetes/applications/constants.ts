import { ServiceType } from '../services/types';

import { AppDataAccessPolicy, AppKind, AppType, DeploymentType } from './types';

// Portainer specific labels
export const appStackNameLabel = 'io.portainer.kubernetes.application.stack';
export const appStackIdLabel = 'io.portainer.kubernetes.application.stackid';
export const appOwnerLabel = 'io.portainer.kubernetes.application.owner';
export const appNoteAnnotation = 'io.portainer.kubernetes.application.note';
export const appDeployMethodLabel = 'io.portainer.kubernetes.application.kind';
export const defaultDeploymentUniqueLabel = 'pod-template-hash';
export const appNameLabel = 'io.portainer.kubernetes.application.name';

export const appRevisionAnnotation = 'deployment.kubernetes.io/revision';

// unchangedAnnotationKeysForRollbackPatch lists the annotations that should be preserved from the deployment and not
// copied from the replicaset when rolling a deployment back
export const unchangedAnnotationKeysForRollbackPatch = [
  'kubectl.kubernetes.io/last-applied-configuration',
  appRevisionAnnotation,
  'deployment.kubernetes.io/revision-history',
  'deployment.kubernetes.io/desired-replicas',
  'deployment.kubernetes.io/max-replicas',
  'deprecated.deployment.rollback.to',
  'deprecated.daemonset.template.generation',
];

export const appKindToDeploymentTypeMap: Record<
  AppKind,
  DeploymentType | null
> = {
  Deployment: 'Replicated',
  StatefulSet: 'Replicated',
  DaemonSet: 'Global',
  Pod: null,
} as const;

// The following constants are used by angular views and can be removed once they are no longer referenced
export const KubernetesApplicationTypes: Record<AppType, AppType> = {
  Deployment: 'Deployment',
  StatefulSet: 'StatefulSet',
  DaemonSet: 'DaemonSet',
  Pod: 'Pod',
  Helm: 'Helm',
} as const;

export const KubernetesApplicationDeploymentTypes: Record<
  DeploymentType,
  DeploymentType
> = {
  Global: 'Global',
  Replicated: 'Replicated',
} as const;

export const KubernetesApplicationDataAccessPolicies: Record<
  AppDataAccessPolicy,
  AppDataAccessPolicy
> = {
  Isolated: 'Isolated',
  Shared: 'Shared',
} as const;

export const KubernetesApplicationServiceTypes: Record<
  ServiceType,
  ServiceType
> = {
  ClusterIP: 'ClusterIP',
  NodePort: 'NodePort',
  LoadBalancer: 'LoadBalancer',
  ExternalName: 'ExternalName',
} as const;
