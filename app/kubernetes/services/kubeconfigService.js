import angular from 'angular';

class KubernetesConfigService {
  /* @ngInject */
  constructor(KubernetesConfig, FileSaver) {
    this.KubernetesConfig = KubernetesConfig;
    this.FileSaver = FileSaver;
  }

  async downloadConfig() {
    const response = await this.KubernetesConfig.get();
    const headers = response.headers();
    const contentDispositionHeader = headers['content-disposition'];
    const filename = contentDispositionHeader.replace('attachment;', '').trim();
    return this.FileSaver.saveAs(response.data, filename);
  }
}

export default KubernetesConfigService;
angular.module('portainer.kubernetes').service('KubernetesConfigService', KubernetesConfigService);
