import _ from 'lodash-es';
import KubernetesContainerViewModel from './container';

export default function KubernetesPodViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.Status = data.status.phase;
  this.ReadyContainerCount = _.filter(data.status.containerStatuses, 'ready').length;
  this.TotalContainerCount = data.status.containerStatuses.length;
  this.CreatedAt = data.status.startTime;
  this.Containers = _.map(data.spec.containers, (container) => {
    const status = _.find(data.status.containerStatuses, (status) => container.name === status.name);
    return new KubernetesContainerViewModel(container, status);
  })
}
