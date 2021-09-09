export default class KubeConfigController {
  /* @ngInject */
  constructor($async, $window, KubernetesConfigService, SettingsService) {
    this.$async = $async;
    this.$window = $window;
    this.KubernetesConfigService = KubernetesConfigService;
    this.SettingsService = SettingsService;
  }

  async downloadKubeconfig() {
    await this.KubernetesConfigService.downloadConfig();
  }

  async expiryHoverMessage() {
    const settings = await this.SettingsService.publicSettings();
    const expiryDays = settings.KubeconfigExpiry;
    switch (expiryDays) {
      case '0':
        this.state.expiryDays = 'not expire';
        break;
      case '24h':
        this.state.expiryDays = 'expire in 1 day';
        break;
      case '168h':
        this.state.expiryDays = 'expire in 7 days';
        break;
      case '720h':
        this.state.expiryDays = 'expire in 30 days';
        break;
      case '8640h':
        this.state.expiryDays = 'expire in 1 year';
        break;
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        isHTTPS: this.$window.location.protocol === 'https:',
        expiryDays: '',
      };
      await this.expiryHoverMessage();
    });
  }
}
