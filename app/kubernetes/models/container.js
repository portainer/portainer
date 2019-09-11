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

export default function KubernetesContainerViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.Images = _.map(data.spec.containers, 'image');
  this.Status = computeStatus(data.status.containerStatuses);
  this.Restarts = _.sumBy(data.status.containerStatuses, 'restartCount');
  this.Node = data.spec.nodeName;
  this.CreatedAt = data.status.startTime;
}
