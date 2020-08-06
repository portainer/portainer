import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import { KubernetesServiceCreatePayload } from 'Kubernetes/models/service/payloads';
import {
  KubernetesPortainerApplicationStackNameLabel,
  KubernetesPortainerApplicationNameLabel,
  KubernetesPortainerApplicationOwnerLabel,
} from 'Kubernetes/models/application/models';
import { KubernetesServiceHeadlessClusterIP, KubernetesService, KubernetesServicePort, KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import { KubernetesApplicationPublishingTypes } from 'Kubernetes/models/application/models';
import KubernetesServiceHelper from 'Kubernetes/helpers/serviceHelper';

function _publishedPortToServicePort(name, publishedPort, type) {
  const res = new KubernetesServicePort();
  res.name = _.toLower(name + '-' + publishedPort.ContainerPort + '-' + publishedPort.Protocol);
  res.port = type === KubernetesServiceTypes.LOAD_BALANCER ? publishedPort.LoadBalancerPort : publishedPort.ContainerPort;
  res.targetPort = publishedPort.ContainerPort;
  res.protocol = publishedPort.Protocol;
  if (type === KubernetesServiceTypes.NODE_PORT && publishedPort.NodePort) {
    res.nodePort = publishedPort.NodePort;
  } else if (type === KubernetesServiceTypes.LOAD_BALANCER && publishedPort.LoadBalancerNodePort) {
    res.nodePort = publishedPort.LoadBalancerNodePort;
  } else {
    delete res.nodePort;
  }
  return res;
}

class KubernetesServiceConverter {
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
    res.ApplicationName = formValues.Name;
    if (formValues.PublishingType === KubernetesApplicationPublishingTypes.CLUSTER || formValues.PublishingType === KubernetesApplicationPublishingTypes.INGRESS) {
      res.Type = KubernetesServiceTypes.NODE_PORT;
    } else if (formValues.PublishingType === KubernetesApplicationPublishingTypes.LOAD_BALANCER) {
      res.Type = KubernetesServiceTypes.LOAD_BALANCER;
    }
    res.Ports = _.map(formValues.PublishedPorts, (item) => _publishedPortToServicePort(formValues.Name, item, res.Type));
    return res;
  }

  static applicationFormValuesToHeadlessService(formValues) {
    const res = KubernetesServiceConverter.applicationFormValuesToService(formValues);
    res.Name = KubernetesServiceHelper.generateHeadlessServiceName(formValues.Name);
    res.Headless = true;
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
    payload.metadata.labels[KubernetesPortainerApplicationNameLabel] = service.ApplicationName;
    payload.metadata.labels[KubernetesPortainerApplicationOwnerLabel] = service.ApplicationOwner;
    payload.spec.ports = service.Ports;
    payload.spec.selector.app = service.ApplicationName;
    if (service.Headless) {
      payload.spec.clusterIP = KubernetesServiceHeadlessClusterIP;
      delete payload.spec.ports;
    } else if (service.Type) {
      payload.spec.type = service.Type;
    }
    return payload;
  }

  static patchPayload(oldService, newService) {
    const oldPayload = KubernetesServiceConverter.createPayload(oldService);
    const newPayload = KubernetesServiceConverter.createPayload(newService);
    const payload = JsonPatch.compare(oldPayload, newPayload);
    return payload;
  }
}

export default KubernetesServiceConverter;
