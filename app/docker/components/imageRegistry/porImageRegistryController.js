import angular from 'angular';
import _ from 'lodash-es';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';
import { RegistryTypes } from '@/portainer/models/registryTypes';

class porImageRegistryController {
  /* @ngInject */
  constructor($async, $scope, ImageHelper, RegistryService, DockerHubService, ImageService, Notifications) {
    this.$async = $async;
    this.$scope = $scope;
    this.ImageHelper = ImageHelper;
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

  getRegistryURL(registry) {
    let url = registry.URL;
    if (registry.Type === RegistryTypes.GITLAB) {
      url = registry.URL + '/' + registry.Gitlab.ProjectPath;
    }
    return url;
  }

  prepareAutocomplete() {
    let images = [];
    const registry = this.model.Registry;
    if (this.isKnownRegistry(registry)) {
      const url = this.getRegistryURL(registry);
      const registryImages = _.filter(this.images, (image) => _.includes(image, url));
      images = _.map(registryImages, (image) => _.replace(image, new RegExp(url + '/?'), ''));
    } else {
      const registries = _.filter(this.availableRegistries, (reg) => this.isKnownRegistry(reg));
      const registryImages = _.flatMap(registries, (registry) => _.filter(this.images, (image) => _.includes(image, registry.URL)));
      const imagesWithoutKnown = _.difference(this.images, registryImages);
      images = _.filter(imagesWithoutKnown, (image) => !this.ImageHelper.imageContainsURL(image));
    }
    this.availableImages = images;
  }

  isDockerhubRegistry() {
    return this.model.UseRegistry && this.model.Registry.Name === 'DockerHub';
  }

  async onRegistryChange() {
    this.prepareAutocomplete();
    this.pullRateLimits = null;
    if (this.model.Registry.Type === RegistryTypes.GITLAB && this.model.Image) {
      this.model.Image = _.replace(this.model.Image, this.model.Registry.Gitlab.ProjectPath, '');
    }

    if (this.isDockerhubRegistry()) {
      this.pullRateLimits = await this.DockerHubService.checkRateLimits(this.endpoint);
      this.setValidity(this.pullRateLimits.remaining >= 0);
    } else {
      this.setValidity(true);
    }
  }

  displayedRegistryURL() {
    return this.getRegistryURL(this.model.Registry) || 'docker.io';
  }

  async onInit() {
    try {
      const [registries, dockerhub, images] = await Promise.all([
        this.RegistryService.registries(),
        this.DockerHubService.dockerhub(),
        this.autoComplete ? this.ImageService.images() : [],
      ]);
      this.images = this.ImageService.getUniqueTagListFromImages(images);
      this.availableRegistries = _.concat(dockerhub, registries);

      const id = this.model.Registry.Id;
      if (!id) {
        this.model.Registry = dockerhub;
      } else {
        this.model.Registry = _.find(this.availableRegistries, { Id: id });
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
