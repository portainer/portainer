export default class KubeConfigController {
  /* @ngInject */
  constructor($window, KubernetesConfigService) {
    this.$window = $window;
    this.KubernetesConfigService = KubernetesConfigService;
  }

  async downloadKubeconfig() {
    await this.KubernetesConfigService.downloadConfig();
  }

  $onInit() {
    this.state = { isHTTPS: this.$window.location.protocol === 'https:' };
  }
}
