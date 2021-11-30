import _ from 'lodash-es';
import * as JsonPatch from 'fast-json-patch';

import { KubernetesServiceCreatePayload } from 'Kubernetes/models/service/payloads';
import {
  KubernetesApplicationPublishingTypes,
  KubernetesPortainerApplicationNameLabel,
  KubernetesPortainerApplicationOwnerLabel,
  KubernetesPortainerApplicationStackNameLabel,
} from 'Kubernetes/models/application/models';
import { KubernetesService, KubernetesServiceHeadlessClusterIP, KubernetesServicePort, KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import KubernetesServiceHelper from 'Kubernetes/helpers/serviceHelper';

function _publishedPortToServicePort(formValues, publishedPort, type) {
  if (publishedPort.IsNew || !publishedPort.NeedsDeletion) {
    const name = formValues.Name;
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
    if (formValues.PublishingType === KubernetesApplicationPublishingTypes.NODE_PORT) {
      res.Type = KubernetesServiceTypes.NODE_PORT;
    } else if (formValues.PublishingType === KubernetesApplicationPublishingTypes.LOAD_BALANCER) {
      res.Type = KubernetesServiceTypes.LOAD_BALANCER;
    }
    const ports = _.map(formValues.PublishedPorts, (item) => _publishedPortToServicePort(formValues, item, res.Type));
    res.Ports = _.uniqBy(_.without(ports, undefined), (p) => p.targetPort + p.protocol);
    return res;
  }

  static applicationFormValuesToServices(formValues) {
    let services = [];
    formValues.Services.forEach(function (service) {
      const res = new KubernetesService();
      res.Namespace = formValues.ResourcePool.Namespace.Name;
      res.Name = service.Name;
      res.StackName = formValues.StackName ? formValues.StackName : formValues.Name;
      res.ApplicationOwner = formValues.ApplicationOwner;
      res.ApplicationName = formValues.Name;
      if (service.Type === KubernetesApplicationPublishingTypes.NODE_PORT) {
        res.Type = KubernetesServiceTypes.NODE_PORT;
      } else if (service.Type === KubernetesApplicationPublishingTypes.LOAD_BALANCER) {
        res.Type = KubernetesServiceTypes.LOAD_BALANCER;
      } else if (service.Type === KubernetesApplicationPublishingTypes.CLUSTER_IP) {
        res.Type = KubernetesServiceTypes.CLUSTER_IP;
      }
      res.Ingress = service.Ingress;

      if (service.Selector !== undefined) {
        res.Selector = service.Selector;
      } else {
        res.Selector = {
          app: formValues.Name,
        };
      }

      let ports = [];
      service.Ports.forEach(function (port, index) {
        const res = new KubernetesServicePort();
        res.name = 'port-' + index;
        res.port = port.port;
        if (port.nodePort) {
          res.nodePort = port.nodePort;
        }
        res.protocol = port.protocol;
        res.targetPort = port.targetPort;
        res.ingress = port.ingress;
        ports.push(res);
      });
      res.Ports = ports;

      services.push(res);
    });
    return services;
  }

  static applicationFormValuesToHeadlessService(formValues) {
    const res = KubernetesServiceConverter.applicationFormValuesToService(formValues);
    res.Name = KubernetesServiceHelper.generateHeadlessServiceName(formValues.Name);
    res.Headless = true;
    res.Selector = {
      app: formValues.Name,
    };
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

    const ports = [];
    service.Ports.forEach((port) => {
      const p = {};
      p.name = port.name;
      p.port = port.port;
      p.nodePort = port.nodePort;
      p.protocol = port.protocol;
      p.targetPort = port.targetPort;
      ports.push(p);
    });
    payload.spec.ports = ports;

    payload.spec.selector = service.Selector;
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
