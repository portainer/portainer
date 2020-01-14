import {KubernetesApplicationPublishingTypes} from 'Kubernetes/models/application';
import _ from 'lodash-es';

export default function KubernetesServiceModelFromApplication(applicationFormValues) {
  this.Namespace = applicationFormValues.ResourcePool.Namespace.Name;
  this.Name = applicationFormValues.Name;
  this.StackName = applicationFormValues.StackName ? applicationFormValues.StackName : applicationFormValues.Name;
  this.Ports = [];

  switch (applicationFormValues.PublishingType) {
    case KubernetesApplicationPublishingTypes.CLUSTER:
      this.Type = 'NodePort';

      _.forEach(applicationFormValues.PublishedPorts, (item) => {
        const port = {
          name: this.Name + '-' + item.ContainerPort,
          port: parseInt(item.ContainerPort, 10),
          targetPort: parseInt(item.ContainerPort, 10),
          protocol: item.Protocol
        };

        if (item.NodePort) {
          port.nodePort = parseInt(item.NodePort, 10);
        }

        this.Ports.push(port);
      });

      break;

    case KubernetesApplicationPublishingTypes.LOADBALANCER:
      this.Type = 'LoadBalancer';

      _.forEach(applicationFormValues.PublishedPorts, (item) => {
        const port = {
          name: this.Name + '-' + item.ContainerPort,
          port: parseInt(item.LoadBalancerPort, 10),
          targetPort: parseInt(item.ContainerPort, 10),
          protocol: item.Protocol
        };

        this.Ports.push(port);
      });

      break;

    default:
      _.forEach(applicationFormValues.PublishedPorts, (item) => {
        const port = {
          name: this.Name + '-' + item.ContainerPort,
          port: parseInt(item.ContainerPort, 10),
          targetPort: parseInt(item.ContainerPort, 10),
          protocol: item.Protocol
        };

        this.Ports.push(port);
      });
  }
}