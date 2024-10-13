import { AppKind, DeploymentType } from './types';

// Portainer specific labels
export const appStackNameLabel = 'io.portainer.kubernetes.application.stack';
export const appStackIdLabel = 'io.portainer.kubernetes.application.stackid';
export const appOwnerLabel = 'io.portainer.kubernetes.application.owner';
export const appNoteAnnotation = 'io.portainer.kubernetes.application.note';
export const appDeployMethodLabel = 'io.portainer.kubernetes.application.kind';
export const defaultDeploymentUniqueLabel = 'pod-template-hash';
export const appNameLabel = 'io.portainer.kubernetes.application.name';
export const PodKubernetesInstanceLabel = 'app.kubernetes.io/instance';
export const PodManagedByLabel = 'app.kubernetes.io/managed-by';

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
