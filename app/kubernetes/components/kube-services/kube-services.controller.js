import { KubernetesService, KubernetesServicePort, KubernetesServiceTypes } from '@/kubernetes/models/service/models';
import { KubernetesApplicationPublishingTypes } from '@/kubernetes/models/application/models/constants';
import { notifyError } from '@/portainer/services/notifications';
import { getServices } from '@/react/kubernetes/networks/services/service';

export default class KubeServicesViewController {
  /* @ngInject */
  constructor($async, EndpointProvider, Authentication) {
    this.$async = $async;
    this.EndpointProvider = EndpointProvider;
    this.Authentication = Authentication;
    this.asyncOnInit = this.asyncOnInit.bind(this);
  }

  addEntry(service) {
    const p = new KubernetesService();
    p.Type = service;

    p.Selector = this.formValues.Selector;

    p.Name = this.getUniqName();
    this.formValues.Services.push(p);
  }

  getUniqName() {
    //services name will follow thia patten: service, service-2, service-3...
    let nameIndex = 2;
    let UniqName = this.formValues.Name;
    const services = this.formValues.Services;

    const sortServices = services.sort((a, b) => {
      return a.Name.localeCompare(b.Name);
    });

    if (sortServices.length !== 0) {
      sortServices.forEach((service) => {
        if (service.Name === UniqName) {
          UniqName = this.formValues.Name + '-' + nameIndex;
          nameIndex += 1;
        }
      });
    }
    return UniqName;
  }

  deleteService(index) {
    this.formValues.Services.splice(index, 1);
  }

  addPort(index) {
    const p = new KubernetesServicePort();
    this.formValues.Services[index].Ports.push(p);
  }

  serviceType(type) {
    switch (type) {
      case KubernetesApplicationPublishingTypes.CLUSTER_IP:
        return KubernetesServiceTypes.CLUSTER_IP;
      case KubernetesApplicationPublishingTypes.NODE_PORT:
        return KubernetesServiceTypes.NODE_PORT;
      case KubernetesApplicationPublishingTypes.LOAD_BALANCER:
        return KubernetesServiceTypes.LOAD_BALANCER;
    }
  }

  isAdmin() {
    return this.Authentication.isAdmin();
  }

  async asyncOnInit() {
    try {
      // get all nodeport services in the cluster, to validate unique nodeports in the form
      const allSettledServices = await Promise.allSettled(this.namespaces.map((namespace) => getServices(this.state.endpointId, namespace)));
      const allServices = allSettledServices
        .filter((settledService) => settledService.status === 'fulfilled' && settledService.value)
        .map((fulfilledService) => fulfilledService.value)
        .flat();
      this.nodePortServices = allServices.filter((service) => service.Type === 'NodePort');
    } catch (error) {
      notifyError('Failure', error, 'Failed getting services');
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
      ],
      selected: KubernetesApplicationPublishingTypes.CLUSTER_IP,
      endpointId: this.EndpointProvider.endpointID(),
    };
    return this.$async(this.asyncOnInit);
  }
}
