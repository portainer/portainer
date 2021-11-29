import { KubernetesService, KubernetesServicePort } from 'Kubernetes/models/service/models';

export default class KubeServicesViewController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;
  }

  addEntry(service) {
    const p = new KubernetesService();
    if (service === 4) {
      p.Type = 1;
      p.Ingress = true;
    } else {
      p.Type = service;
    }

    p.Selector = this.formValues.Selector;

    p.Name = this.validName();
    this.state.nameIndex += 1;
    this.formValues.Services.push(p);
  }

  validName() {
    let name = this.formValues.Name + '-' + this.state.nameIndex;
    const services = this.formValues.Services;
    services.forEach((service) => {
      if (service.Name === name) {
        this.state.nameIndex += 1;
        name = this.formValues.Name + '-' + this.state.nameIndex;
      }
    });
    const validName = this.formValues.Name + '-' + this.state.nameIndex;
    return validName;
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
      case 1:
        return 'ClusterIP';
      case 2:
        return 'NodePort';
      case 3:
        return 'Load Balancer';
      case 4:
        return 'Ingress';
    }
  }

  iconStyle(type) {
    switch (type) {
      case 1:
        return 'fa fa-list-alt';
      case 2:
        return 'fa fa-list';
      case 3:
        return 'fa fa-project-diagram';
      case 4:
        return 'fa fa-route';
    }
  }
  $onInit() {
    this.state = {
      serviceType: [
        {
          typeName: 'ClusterIP',
          typeValue: 1,
          active: true,
        },
        {
          typeName: 'NodePort',
          typeValue: 2,
          active: true,
        },
        {
          typeName: 'LocaBalancer',
          typeValue: 3,
          active: true,
        },
        {
          typeName: 'Ingress',
          typeValue: 4,
          active: true,
        },
      ],
      selected: 1,
      nameIndex: '',
    };
    const serviceNumber = this.formValues.Services.length;
    this.state.nameIndex = serviceNumber;
  }
}
