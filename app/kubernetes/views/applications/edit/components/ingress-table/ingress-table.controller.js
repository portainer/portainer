export default class KubernetesApplicationIngressController {
  /* @ngInject */
  constructor($async, KubernetesIngressService) {
    this.$async = $async;
    this.KubernetesIngressService = KubernetesIngressService;
  }

  $onInit() {
    return this.$async(async () => {
      this.hasIngress;
      this.applicationIngress = [];
      const ingresses = await this.KubernetesIngressService.get(this.application.ResourcePool);
      const services = this.application.Services;

      services.forEach((service) => {
        ingresses.filter((ingress) => {
          ingress.Paths.map((element) => {
            if (element.ServiceName === service.metadata.name) {
              this.applicationIngress.push(element);
              this.hasIngress = true;
            }
          });
        });
      });
    });
  }
}
