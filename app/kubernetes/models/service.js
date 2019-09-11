import _ from 'lodash-es';

export default function KubernetesServiceViewModel(data) {
  this.Id = data.metadata.uid;
  this.Name = data.metadata.name;
  this.Namespace = data.metadata.namespace;
  this.Images = _.map(data.spec.template.spec.containers, 'image');
  this.RunningPodsCount = data.status.availableReplicas || data.status.replicas - data.status.unavailableReplicas;
  this.TotalPodsCount = data.status.replicas;
  this.PublishedPorts = _.flatMapDeep(_.map(data.BoundServices, (service) => {
    if (service.spec.Type === 'LoadBalancer') {
      return _.map(service.spec.ports, (port) => {
        port.IPAddress = service.status.loadbalancer.ip || service.status.loadBalancer.hostname;
        return port;
      });
    }
    return service.spec.ports;
  }));
  this.CreatedAt = data.metadata.creationTimestamp;
}