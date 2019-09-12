import _ from 'lodash-es';

export default function KubernetesSecretViewModel(data) {
  this.Id = data.metadata.uid;
  const hostName = _.find(data.status.addresses, {type: 'Hostname'});
  this.Name = hostName ? hostName.address : data.metadata.Name;
  this.Role = _.has(data.metadata.labels, 'node-role.kubernetes.io/master') ? 'Manager' : 'Worker';
  const readyStatus = _.find(data.status.conditions, {type: 'Ready'});
  this.Status = readyStatus && readyStatus.status === "True" ? 'Ready' : 'Warning';
  this.CPU = data.status.capacity.cpu;
  this.Memory = data.status.capacity.memory;
  this.Version = data.status.nodeInfo.kubeletVersion;
  const internalIP = _.find(data.status.addresses, {type: 'InternalIP'});
  this.IPAddress = internalIP ? internalIP.address : '-';
}
