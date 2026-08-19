export const KubernetesResourceTypes = Object.freeze({
  NAMESPACE: 'Namespace',
  RESOURCEQUOTA: 'ResourceQuota',
  CONFIGMAP: 'ConfigMap',
  SECRET: 'Secret',
  DEPLOYMENT: 'Deployment',
  STATEFULSET: 'StatefulSet',
  DAEMONSET: 'Daemonset',
  PERSISTENT_VOLUME_CLAIM: 'PersistentVolumeClaim',
  SERVICE: 'Service',
  INGRESS: 'Ingress',
  HORIZONTAL_POD_AUTOSCALER: 'HorizontalPodAutoscaler',
});

export const KubernetesResourceActions = Object.freeze({
  CREATE: 'Create',
  UPDATE: 'Update',
  DELETE: 'Delete',
});
