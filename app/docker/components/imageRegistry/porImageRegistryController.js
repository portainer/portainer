import angular from 'angular';
import _ from 'lodash-es';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';

class porImageRegistryController {
  /* @ngInject */
  constructor($async, $scope, RegistryService, DockerHubService, ImageService, Notifications) {
    this.$async = $async;
    this.$scope = $scope;
    this.RegistryService = RegistryService;
    this.DockerHubService = DockerHubService;
    this.ImageService = ImageService;
    this.Notifications = Notifications;

    this.onInit = this.onInit.bind(this);
    this.onRegistryChange = this.onRegistryChange.bind(this);

    this.$scope.$watch(() => this.model.Registry, this.onRegistryChange);
  }

  isKnownRepository(registry) {
    return !(registry instanceof DockerHubViewModel) && registry.URL;
  }

  onRegistryChange() {
    let images = [];
    const registry = this.model.Registry;
    if (this.isKnownRepository(registry)) {
      const registryImages = _.filter(this.images, (image) => _.includes(image, this.model.Registry.URL));
      images = _.map(registryImages, (image) => _.replace(image, registry.URL + '/', ''));
    } else {
      const registries = _.filter(this.availableRegistries, (reg) => this.isKnownRepository(reg));
      const registryImages = _.flatMap(registries, (registry) => _.filter(this.images, (image) => _.includes(image, registry.URL)));
      images = _.difference(this.images, registryImages);
    }
    this.availableImages = images;
  }

  async onInit() {
    try {
      const [registries, dockerhub, images] = await Promise.all([
        this.RegistryService.registries(),
        this.DockerHubService.dockerhub(),
        this.autoComplete ? this.ImageService.images() : []
      ]);
      this.images = this.ImageService.getUniqueTagListFromImages(images);
      this.availableRegistries = _.concat(dockerhub, registries);

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
