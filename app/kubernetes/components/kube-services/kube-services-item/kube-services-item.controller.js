import { KubernetesServicePort, KubernetesIngressServiceRoute } from 'Kubernetes/models/service/models';
import { KubernetesFormValidationReferences } from 'Kubernetes/models/application/formValues';

export default class KubeServicesItemViewController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;
  }

  addPort() {
    const p = new KubernetesServicePort();
    p.nodePort = '';
    p.port = '';
    p.targetPort = '';
    p.protocol = 'TCP';

    if (this.ingressType) {
      const r = new KubernetesIngressServiceRoute();
      r.ServiceName = this.serviceName;
      p.ingress = r;
      p.Ingress = true;
      this.servicePorts.push(p);
    } else {
      this.servicePorts.push(p);
    }
  }

  removePort(index) {
    this.servicePorts.splice(index, 1);
  }

  $onInit() {
    if (this.servicePorts.length === 0) {
      this.addPort();
    }

    this.state = {
      duplicates: {
        publishedPorts: {
          nodePorts: new KubernetesFormValidationReferences(),
        },
      },
    };
  }
}
