export const KubernetesSystem_DefaultDeploymentUniqueLabelKey = 'pod-template-hash';
export const KubernetesSystem_RevisionAnnotation = 'deployment.kubernetes.io/revision';
export const KubernetesSystem_RevisionHistoryAnnotation = 'deployment.kubernetes.io/revision-history';
export const KubernetesSystem_ChangeCauseAnnotation = 'kubernetes.io/change-cause';
export const KubernetesSystem_DesiredReplicasAnnotation = 'deployment.kubernetes.io/desired-replicas';
export const KubernetesSystem_MaxReplicasAnnotation = 'deployment.kubernetes.io/max-replicas';

// annotationsToSkip lists the annotations that should be preserved from the deployment and not
// copied from the replicaset when rolling a deployment back
// var annotationsToSkip = map[string]bool{
//   corev1.LastAppliedConfigAnnotation:       true,
//   deploymentutil.RevisionAnnotation:        true,
//   deploymentutil.RevisionHistoryAnnotation: true,
//   deploymentutil.DesiredReplicasAnnotation: true,
//   deploymentutil.MaxReplicasAnnotation:     true,
//   appsv1.DeprecatedRollbackTo:              true,
// }

// LastAppliedConfigAnnotation is the annotation used to store the previous
// configuration of a resource for use in a three way diff by UpdateApplyAnnotation.
const LastAppliedConfigAnnotation = 'kubectl.kubernetes.io/last-applied-configuration';

const DeprecatedRollbackTo = 'deprecated.deployment.rollback.to';

export const KubernetesSystem_AnnotationsToSkip = {
  [LastAppliedConfigAnnotation]: true,
  [KubernetesSystem_RevisionAnnotation]: true,
  [KubernetesSystem_RevisionHistoryAnnotation]: true,
  [KubernetesSystem_DesiredReplicasAnnotation]: true,
  [KubernetesSystem_MaxReplicasAnnotation]: true,
  [DeprecatedRollbackTo]: true,
};
