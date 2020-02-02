import _ from 'lodash-es';
import filesizeParser from 'filesize-parser';

export function KubernetesApplicationViewModel(type, data, service) {
  if (type === KubernetesApplicationDeploymentTypes.REPLICATED) {
    this.DeploymentType = KubernetesApplicationDeploymentTypes.REPLICATED;
    this.RunningPodsCount = data.status.availableReplicas || data.status.replicas - data.status.unavailableReplicas || 0;
    this.TotalPodsCount = data.status.replicas || data.spec.replicas;
  } else if (type === KubernetesApplicationDeploymentTypes.GLOBAL) {
    this.DeploymentType = KubernetesApplicationDeploymentTypes.GLOBAL;
    this.RunningPodsCount = data.status.numberAvailable || data.status.desiredNumberScheduled - data.status.numberUnavailable || 0;
    this.TotalPodsCount = data.status.desiredNumberScheduled;
  } else {
    this.DeploymentType = 'Unknown';
    this.RunningPodsCount = 0;
    this.TotalPodsCount = 0;
  }
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Stack = data.metadata.annotations[KubernetesApplicationStackAnnotationKey] || '-';
  this.ResourcePool = data.metadata.namespace;
  this.Image = data.spec.template.spec.containers[0].image;
  this.CreatedAt = data.metadata.creationTimestamp;
  this.Pods = data.Pods;
  const limits = {
    Cpu: 0,
    Memory: 0
  };
  this.Limits = _.reduce(data.spec.template.spec.containers, (acc, item) => {
    if (item.resources.limits && item.resources.limits.cpu) {
      acc.Cpu += parseInt(item.resources.limits.cpu);
      if (_.endsWith(item.resources.limits.cpu, 'm')) {
        acc.Cpu /= 1000;
      }
    }
    if (item.resources.limits && item.resources.limits.memory) {
      acc.Memory += filesizeParser(item.resources.limits.memory, {base: 10});
    }
    return acc;
  }, limits);

  if (service) {
    const serviceType = service.spec.type;
    this.ServiceType = serviceType;
    this.ServiceId = service.metadata.uid;

    if (serviceType === 'LoadBalancer') {
      if (service.status.loadBalancer.ingress && service.status.loadBalancer.ingress.length > 0) {
        this.LoadBalancerIPAddress = service.status.loadBalancer.ingress[0].ip || service.status.loadBalancer.ingress[0].hostname;
      }
    }

    this.PublishedPorts = service.spec.ports;
  } else {
    this.PublishedPorts = [];
  }
}

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

export function KubernetesApplicationEnvironmentVariableFormValue() {
  const envVar = {
    Name: '',
    Value: '',
    IsSecret: false
  };

  return envVar;
}

export function KubernetesApplicationPersistedFolderFormValue(storageClass) {
  const persistedFolder = {
    ContainerPath: '',
    Size: '',
    StorageClass: storageClass
  };

  return persistedFolder;
}

export function KubernetesApplicationPublishedPortFormValue() {
  const publishedPort = {
    ContainerPort: '',
    NodePort: '',
    LoadBalancerPort: '',
    Protocol: 'TCP'
  };

  return publishedPort;
}

// TODO: review LP
// Not sure if this should be located here. It is a convenience function to generate application volume names.
export function KubernetesApplicationVolumeName(applicationName, volumePath) {
  return applicationName + volumePath.replace(/[^a-z0-9\-]/gi, '-').toLowerCase();
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