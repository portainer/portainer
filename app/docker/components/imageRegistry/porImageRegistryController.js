import angular from 'angular';
import _ from 'lodash-es';

class porImageRegistryController {
  /* @ngInject */
  constructor($async, RegistryService, DockerHubService, ImageService, Notifications) {
    this.$async = $async;
    this.RegistryService = RegistryService;
    this.DockerHubService = DockerHubService;
    this.ImageService = ImageService;
    this.Notifications = Notifications;

    this.onInit = this.onInit.bind(this);
  }

  async onInit() {
    try {
      const [registries, dockerhub, availableImages] = await Promise.all([
        this.RegistryService.registries(),
        this.DockerHubService.dockerhub(),
        this.autoComplete ? this.ImageService.images() : []
      ]);
      this.availableImages = this.ImageService.getUniqueTagListFromImages(availableImages);
      this.availableRegistries = [dockerhub].concat(registries);

      const id = this.model.Registry.Id;
      if (!id) {
        this.model.Registry = dockerhub;
      } else {
        this.model.Registry = _.find(this.availableRegistries, { 'Id': id });
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve registries');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default porImageRegistryController;
angular.module('portainer.docker').controller('porImageRegistryController', porImageRegistryController);
