import _ from 'lodash-es';
import { KubernetesServicePort, KubernetesIngressServiceRoute } from 'Kubernetes/models/service/models';
import { KubernetesFormValidationReferences } from 'Kubernetes/models/application/formValues';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import { KubernetesApplicationPublishingTypes } from 'Kubernetes/models/application/models/constants';

export default class KubeServicesItemViewController {
  /* @ngInject */
  constructor(EndpointProvider, Authentication) {
    this.EndpointProvider = EndpointProvider;
    this.Authentication = Authentication;
    this.KubernetesApplicationPublishingTypes = KubernetesApplicationPublishingTypes;
  }

  addPort() {
    const port = new KubernetesServicePort();
    port.nodePort = '';
    port.port = '';
    port.targetPort = '';
    port.protocol = 'TCP';

    if (this.ingressType) {
      const route = new KubernetesIngressServiceRoute();
      route.ServiceName = this.serviceName;

      if (this.serviceType === KubernetesApplicationPublishingTypes.CLUSTER_IP && this.originalIngresses.length > 0) {
        if (!route.IngressName) {
          route.IngressName = this.originalIngresses[0].Name;
        }

        if (!route.Host) {
          route.Host = this.originalIngresses[0].Hosts[0];
        }
      }

      port.ingress = route;
      port.Ingress = true;
    }
    this.servicePorts.push(port);
  }

  removePort(index) {
    this.servicePorts.splice(index, 1);
  }

  servicePort(index) {
    const targetPort = this.servicePorts[index].targetPort;
    this.servicePorts[index].port = targetPort;
  }

  isAdmin() {
    return this.Authentication.isAdmin();
  }

  onChangeContainerPort() {
    const state = this.state.duplicates.targetPort;
    const source = _.map(this.servicePorts, (sp) => sp.targetPort);
    const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
    state.refs = duplicates;
    state.hasRefs = Object.keys(duplicates).length > 0;
  }

  onChangeServicePort() {
    const state = this.state.duplicates.servicePort;
    const source = _.map(this.servicePorts, (sp) => sp.port);
    const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
    state.refs = duplicates;
    state.hasRefs = Object.keys(duplicates).length > 0;
  }

  onChangeNodePort() {
    const state = this.state.duplicates.nodePort;
    const source = _.map(this.servicePorts, (sp) => sp.nodePort);
    const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
    state.refs = duplicates;
    state.hasRefs = Object.keys(duplicates).length > 0;
  }

  $onInit() {
    if (this.servicePorts.length === 0) {
      this.addPort();
    }

    this.state = {
      duplicates: {
        targetPort: new KubernetesFormValidationReferences(),
        servicePort: new KubernetesFormValidationReferences(),
        nodePort: new KubernetesFormValidationReferences(),
      },
      endpointId: this.EndpointProvider.endpointID(),
    };
  }
}
