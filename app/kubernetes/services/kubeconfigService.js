import angular from 'angular';

class KubernetesConfigService {
  /* @ngInject */
  constructor(KubernetesConfig, FileSaver, SettingsService) {
    this.KubernetesConfig = KubernetesConfig;
    this.FileSaver = FileSaver;
    this.SettingsService = SettingsService;
  }

  async downloadKubeconfigFile(environmentIDs) {
    const response = await this.KubernetesConfig.get(environmentIDs);
    const headers = response.headers();
    const contentDispositionHeader = headers['content-disposition'];
    const filename = contentDispositionHeader.replace('attachment;', '').trim();
    return this.FileSaver.saveAs(response.data, filename);
  }

  async expiryMessage() {
    const settings = await this.SettingsService.publicSettings();
    const expiryDays = settings.KubeconfigExpiry;
    const prefix = 'Kubeconfig file will ';
    switch (expiryDays) {
      case '0':
        return prefix + 'not expire.';
      case '24h':
        return prefix + 'expire in 1 day.';
      case '168h':
        return prefix + 'expire in 7 days.';
      case '720h':
        return prefix + 'expire in 30 days.';
      case '8640h':
        return prefix + 'expire in 1 year.';
    }
    return '';
  }
}

export default KubernetesConfigService;
angular.module('portainer.kubernetes').service('KubernetesConfigService', KubernetesConfigService);
