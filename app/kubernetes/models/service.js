import _ from 'lodash-es';
import { KubernetesContainerViewModel } from './container';

export function KubernetesServiceViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.Images = _.map(data.spec.template.spec.containers, 'image');
  this.RunningPodsCount = data.status.availableReplicas || data.status.replicas - data.status.unavailableReplicas;
  this.TotalPodsCount = data.status.replicas;
  this.PublishedPorts = _.flatMapDeep(_.map(data.BoundServices, (service) => {
    if (service.spec.type === 'LoadBalancer') {
      return _.map(service.spec.ports, (port) => {
        if (service.status.loadBalancer.ingress && service.status.loadBalancer.ingress.length > 0) {
          port.IPAddress = service.status.loadBalancer.ingress[0].ip || service.status.loadBalancer.ingress[0].hostname;
        }
        return port;
      });
    }
    return service.spec.ports;
  }));
  this.CreatedAt = data.metadata.creationTimestamp;
}

export function KubernetesServiceDetailsViewModel(data, yaml) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.Images = _.map(data.spec.template.spec.containers, 'image');
  this.CreatedAt = data.metadata.creationTimestamp;
  this.Replicas = data.spec.replicas;
  this.Selectors = data.spec.selector.matchLabels;
  this.Labels = data.metadata.labels;
  this.Containers = _.map(data.Containers, (item) => new KubernetesContainerViewModel(item));
  this.Yaml = yaml;
}