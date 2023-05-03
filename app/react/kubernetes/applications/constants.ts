import { AppKind, DeploymentType } from './types';

// Portainer specific labels
export const appStackNameLabel = 'io.portainer.kubernetes.application.stack';
export const appStackIdLabel = 'io.portainer.kubernetes.application.stackid';
export const appOwnerLabel = 'io.portainer.kubernetes.application.owner';
export const appNoteAnnotation = 'io.portainer.kubernetes.application.note';
export const appDeployMethodLabel = 'io.portainer.kubernetes.application.kind';
export const defaultDeploymentUniqueLabel = 'pod-template-hash';

export const appRevisionAnnotation = 'deployment.kubernetes.io/revision';

export const unchangedAnnotationsForRollbackPatch = [
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
};
