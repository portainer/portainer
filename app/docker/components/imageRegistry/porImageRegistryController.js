import angular from 'angular';
import _ from 'lodash-es';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';
import { RegistryTypes } from 'Extensions/registry-management/models/registryTypes';

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

  isKnownRegistry(registry) {
    return !(registry instanceof DockerHubViewModel) && registry.URL;
  }

  prepareAutocomplete() {
    let images = [];
    const registry = this.model.Registry;
    if (this.isKnownRegistry(registry)) {
      const registryImages = _.filter(this.images, (image) => _.includes(image, this.model.Registry.URL));
      images = _.map(registryImages, (image) => _.replace(image, registry.URL + '/', ''));
    } else {
      const registries = _.filter(this.availableRegistries, (reg) => this.isKnownRegistry(reg));
      const registryImages = _.flatMap(registries, (registry) => _.filter(this.images, (image) => _.includes(image, registry.URL)));
      const imagesWithoutKnown = _.difference(this.images, registryImages);
      images = _.filter(imagesWithoutKnown, (image) => {
        const split = _.split(image, '/');
        const url = split[0];
        if (split.length > 1) {
          return !_.includes(url, '.') && !_.includes(url, ':');
        }
        return true;
      });
    }
    this.availableImages = images;
  }

  onRegistryChange() {
    this.changeRegistryURL();
    this.prepareAutocomplete();
  }

  changeRegistryURL() {
    if (this.model.Registry.Type === RegistryTypes.GITLAB) {
      this.model.Registry.URL = this.model.Registry.URL + '/' + _.toLower(this.model.Registry.Gitlab.ProjectPath);
    }
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
