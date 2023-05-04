import _ from 'lodash-es';
import { KubernetesServicePort } from 'Kubernetes/models/service/models';
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
    this.service.Ports.push(port);
  }

  removePort(index) {
    this.service.Ports.splice(index, 1);
  }

  servicePort(index) {
    const targetPort = this.service.Ports[index].targetPort;
    this.service.Ports[index].port = targetPort;
    this.onChangeServicePort();
  }

  isAdmin() {
    return this.Authentication.isAdmin();
  }

  onChangeContainerPort() {
    const state = this.state.duplicates.targetPort;
    const source = _.map(this.service.Ports, (sp) => sp.targetPort);
    const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
    state.refs = duplicates;
    state.hasRefs = Object.keys(duplicates).length > 0;
  }

  onChangeServicePort() {
    const state = this.state.duplicates.servicePort;
    const source = _.map(this.service.Ports, (sp) => sp.port);
    const duplicates = KubernetesFormValidationHelper.getDuplicates(source);
    state.refs = duplicates;
    state.hasRefs = Object.keys(duplicates).length > 0;

    this.service.servicePortError = state.hasRefs;
  }

  onChangeNodePort() {
    const state = this.state.duplicates.nodePort;

    // create a list of all the node ports (number[]) in the cluster and current form
    const clusterNodePortsWithoutCurrentService = this.nodePortServices
      .filter((npService) => npService.Name !== this.service.Name)
      .map((npService) => npService.Ports)
      .flat()
      .map((npServicePorts) => npServicePorts.NodePort);
    const formNodePortsWithoutCurrentService = this.formServices
      .filter((formService) => formService.Type === KubernetesApplicationPublishingTypes.NODE_PORT && formService.Name !== this.service.Name)
      .map((formService) => formService.Ports)
      .flat()
      .map((formServicePorts) => formServicePorts.nodePort);
    const serviceNodePorts = this.service.Ports.map((sp) => sp.nodePort);
    // getDuplicates cares about the index, so put the serviceNodePorts at the start
    const allNodePortsWithoutCurrentService = [...clusterNodePortsWithoutCurrentService, ...formNodePortsWithoutCurrentService];

    const duplicates = KubernetesFormValidationHelper.getDuplicateNodePorts(serviceNodePorts, allNodePortsWithoutCurrentService);
    state.refs = duplicates;
    state.hasRefs = Object.keys(duplicates).length > 0;

    this.service.nodePortError = state.hasRefs;
  }

  $onInit() {
    if (this.service.Ports.length === 0) {
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
