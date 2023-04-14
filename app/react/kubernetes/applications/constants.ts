import { AppKind, DeploymentType } from './types';

// Portainer specific labels
export const appStackNameLabel = 'io.portainer.kubernetes.application.stack';
export const appOwnerLabel = 'io.portainer.kubernetes.application.owner';
export const appNoteAnnotation = 'io.portainer.kubernetes.application.note';
export const appDeployMethodLabel = 'io.portainer.kubernetes.application.kind';

export const appKindToDeploymentTypeMap: Record<
  AppKind,
  DeploymentType | null
> = {
  Deployment: 'Replicated',
  StatefulSet: 'Replicated',
  DaemonSet: 'Global',
  Pod: null,
};
