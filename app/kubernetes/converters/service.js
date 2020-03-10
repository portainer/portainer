import _ from 'lodash-es';
import { KubernetesServiceCreatePayload } from 'Kubernetes/models/service/payloads';
import { KubernetesPortainerApplicationStackNameLabel, KubernetesPortainerApplicationNameLabel, KubernetesPortainerApplicationOwnerLabel } from 'Kubernetes/models/application/models';
import { KubernetesServiceHeadlessClusterIP, KubernetesService, KubernetesServicePort, KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import { KubernetesApplicationPublishingTypes } from 'Kubernetes/models/application/models';
import KubernetesServiceHelper from 'Kubernetes/helpers/serviceHelper';

class KubernetesServiceConverter {
  static publishedPortToServicePort(name, publishedPort, type) {
    const res = new KubernetesServicePort();
    res.name = name + '-' + publishedPort.ContainerPort;
    res.port = parseInt(type === KubernetesServiceTypes.LOAD_BALANCER ? publishedPort.LoadBalancerPort : publishedPort.ContainerPort , 10);
    res.targetPort = parseInt(publishedPort.ContainerPort, 10);
    res.protocol = publishedPort.Protocol;
    if (type === KubernetesServiceTypes.NODE_PORT && publishedPort.NodePort) {
      res.nodePort = parseInt(publishedPort.NodePort, 10);
    } else {
      delete res.nodePort;
    }
    return res;
  }

  /**
  * Generate KubernetesService from KubernetesApplicationFormValues
  * @param {KubernetesApplicationFormValues} formValues
  */
  static applicationFormValuesToService(formValues) {
    const res = new KubernetesService();
    res.Namespace = formValues.ResourcePool.Namespace.Name;
    res.Name = formValues.Name;
    res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
    res.ApplicationOwner = formValues.ApplicationOwner;
    if (formValues.PublishingType === KubernetesApplicationPublishingTypes.CLUSTER) {
      res.Type = KubernetesServiceTypes.NODE_PORT;
    } else if (formValues.PublishingType === KubernetesApplicationPublishingTypes.LOADBALANCER) {
      res.Type = KubernetesServiceTypes.LOAD_BALANCER;
    }
    res.Ports = _.map(formValues.PublishedPorts, (item) => KubernetesServiceConverter.publishedPortToServicePort(formValues.Name, item, res.Type));
    return res;
  }

  /**
   * Generate CREATE payload from Service
   * @param {KubernetesService} model Service to genereate payload from
   */
  static createPayload(service) {
    const payload = new KubernetesServiceCreatePayload();
    payload.metadata.name = service.Name;
    payload.metadata.namespace = service.Namespace;
    payload.metadata.labels[KubernetesPortainerApplicationStackNameLabel] = service.StackName;
    payload.metadata.labels[KubernetesPortainerApplicationNameLabel] = service.Name;
    payload.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = service.ApplicationOwner;
    payload.spec.ports = service.Ports;
    payload.spec.selector.app = service.Name;
    if (service.Headless) {
      payload.spec.clusterIP = KubernetesServiceHeadlessClusterIP;
      payload.metadata.name = KubernetesServiceHelper.generateHeadlessServiceName(payload.metadata.name);
      delete payload.spec.ports;
    } else if (service.Type) {
      payload.spec.type = service.Type;
    }
    return payload;
  }
}

export default KubernetesServiceConverter;