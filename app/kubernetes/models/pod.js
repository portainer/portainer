import _ from 'lodash-es';

function computeStatus(statuses) {
  const containerStatuses = _.map(statuses, 'state');
  const running = _.filter(containerStatuses, (s) => s.running).length;
  const waiting = _.filter(containerStatuses, (s) => s.waiting).length;
  if (waiting) {
    return 'Waiting';
  } else if (!running) {
    return 'Terminated';
  }
  return 'Running';
}

export function KubernetesPodViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.Images = _.map(data.spec.containers, 'image');
  this.Status = computeStatus(data.status.containerStatuses);
  this.Restarts = _.sumBy(data.status.containerStatuses, 'restartCount');
  this.Node = data.spec.nodeName;
  this.CreatedAt = data.status.startTime;
}

function KubernetesContainerViewModel(data) {
  this.Name = data.name;
  this.Image = data.image;
  this.Ready = data.ready;
  this.RestartCount = data.restartCount;
  this.CurrentState = data.state;
  this.LastState = data.lastState;
}

export function KubernetesContainerDetailsViewModel(data, yaml) {
  Object.assign(this, new KubernetesPodViewModel(data));
  this.ServiceAccount = data.spec.serviceAccountName || '-';
  this.Labels = data.metadata.labels;
  this.Conditions = data.status.conditions;
  this.Containers = _.map(data.status.containerStatuses, (item) => new KubernetesContainerViewModel(item));
  this.Yaml = yaml;
}