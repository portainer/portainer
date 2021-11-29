import { KubernetesService, KubernetesServicePort, KubernetesServiceTypes } from 'Kubernetes/models/service/models';
import { KubernetesApplicationPublishingTypes } from 'Kubernetes/models/application/models/constants';

export default class KubeServicesViewController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;
  }

  addEntry(service) {
    const p = new KubernetesService();
    if (service === KubernetesApplicationPublishingTypes.INGRESS) {
      p.Type = KubernetesApplicationPublishingTypes.CLUSTER_IP;
      p.Ingress = true;
    } else {
      p.Type = service;
    }

    p.Selector = this.formValues.Selector;

    p.Name = this.getUniqName();
    this.state.nameIndex += 1;
    this.formValues.Services.push(p);
  }

  getUniqName() {
    let name = this.formValues.Name + '-' + this.state.nameIndex;
    const services = this.formValues.Services;
    services.forEach((service) => {
      if (service.Name === name) {
        this.state.nameIndex += 1;
        name = this.formValues.Name + '-' + this.state.nameIndex;
      }
    });
    const UniqName = this.formValues.Name + '-' + this.state.nameIndex;
    return UniqName;
  }

  deleteService(index) {
    this.formValues.Services.splice(index, 1);
    this.state.nameIndex -= 1;
  }

  addPort(index) {
    const p = new KubernetesServicePort();
    this.formValues.Services[index].Ports.push(p);
  }

  updateIngress() {
    this.state.serviceType[3].active = true;
  }

  serviceType(type) {
    switch (type) {
      case KubernetesServiceTypes.CLUSTER_IP:
        return 'ClusterIP';
      case KubernetesServiceTypes.NODE_PORT:
        return 'NodePort';
      case KubernetesServiceTypes.LOAD_BALANCER:
        return 'Load Balancer';
      case KubernetesServiceTypes.INGRESS:
        return 'Ingress';
    }
  }

  iconStyle(type) {
    switch (type) {
      case KubernetesApplicationPublishingTypes.CLUSTER_IP:
        return 'fa fa-list-alt';
      case KubernetesApplicationPublishingTypes.NODE_PORT:
        return 'fa fa-list';
      case KubernetesApplicationPublishingTypes.LOAD_BALANCER:
        return 'fa fa-project-diagram';
      case KubernetesApplicationPublishingTypes.INGRESS:
        return 'fa fa-route';
    }
  }
  $onInit() {
    this.state = {
      serviceType: [
        {
          typeName: KubernetesServiceTypes.CLUSTER_IP,
          typeValue: KubernetesApplicationPublishingTypes.CLUSTER_IP,
        },
        {
          typeName: KubernetesServiceTypes.NODE_PORT,
          typeValue: KubernetesApplicationPublishingTypes.NODE_PORT,
        },
        {
          typeName: KubernetesServiceTypes.LOAD_BALANCER,
          typeValue: KubernetesApplicationPublishingTypes.LOAD_BALANCER,
        },
        {
          typeName: KubernetesServiceTypes.INGRESS,
          typeValue: KubernetesApplicationPublishingTypes.INGRESS,
        },
      ],
      selected: KubernetesApplicationPublishingTypes.CLUSTER_IP,
      nameIndex: '',
    };
    const serviceNumber = this.formValues.Services.length;
    this.state.nameIndex = serviceNumber;
  }
}
