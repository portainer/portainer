import _ from 'lodash-es';

export function KubernetesNodeViewModel(data) {
  this.Id = data.metadata.uid;
  const hostName = _.find(data.status.addresses, {type: 'Hostname'});
  this.Name = hostName ? hostName.address : data.metadata.Name;
  this.Role = _.has(data.metadata.labels, 'node-role.kubernetes.io/master') ? 'Manager' : 'Worker';
  const readyStatus = _.find(data.status.conditions, {type: 'Ready'});
  this.Status = readyStatus && readyStatus.status === "True" ? 'Ready' : 'Warning';
  this.CPU = parseInt(data.status.allocatable.cpu);
  this.Memory = data.status.allocatable.memory;
  this.Version = data.status.nodeInfo.kubeletVersion;
  const internalIP = _.find(data.status.addresses, {type: 'InternalIP'});
  this.IPAddress = internalIP ? internalIP.address : '-';
}

export function KubernetesNodeDetailsViewModel(data, yaml) {
  Object.assign(this, new KubernetesNodeViewModel(data));
  this.CreatedAt = data.metadata.creationTimestamp;
  this.OS = {
    Architecture: data.status.nodeInfo.architecture,
    Platform: data.status.nodeInfo.operatingSystem,
    Image: data.status.nodeInfo.osImage
  };
  this.Conditions = data.status.conditions;
  this.Yaml = yaml;
}
