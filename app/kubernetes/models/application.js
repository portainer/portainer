export function KubernetesApplicationFormValues() {
  this.ResourcePool = '';
  this.Name = '';
  this.StackName = '';
  this.Image = '';
  this.ReplicaCount = 1;
  this.EnvironmentVariables = [];
  this.PersistedFolders = [];
  this.PublishedPorts = [];
  this.MemoryLimit = 0;
  this.CpuLimit = 0;
  this.DeploymentType = KubernetesApplicationDeploymentTypes.REPLICATED;
  this.PublishingType = KubernetesApplicationPublishingTypes.INTERNAL;
}

export const KubernetesApplicationDeploymentTypes = Object.freeze({
  'REPLICATED': 1,
  'GLOBAL': 2
});

export const KubernetesApplicationPublishingTypes = Object.freeze({
  'INTERNAL': 1,
  'CLUSTER': 2,
  'LOADBALANCER': 3
});

export const KubernetesApplicationStackAnnotationKey = 'io.portainer.kubernetes.stack';