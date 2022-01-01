import angular from 'angular';
import _ from 'lodash-es';
import { DockerHubViewModel } from 'Portainer/models/dockerhub';
import { RegistryTypes } from '@/portainer/models/registryTypes';

class porImageRegistryController {
  /* @ngInject */
  constructor($async, $scope, ImageHelper, RegistryService, EndpointService, ImageService, Notifications) {
    this.$async = $async;
    this.$scope = $scope;
    this.ImageHelper = ImageHelper;
    this.RegistryService = RegistryService;
    this.EndpointService = EndpointService;
    this.ImageService = ImageService;
    this.Notifications = Notifications;

    this.onRegistryChange = this.onRegistryChange.bind(this);
    this.onImageChange = this.onImageChange.bind(this);

    this.registries = [];
    this.images = [];
    this.defaultRegistry = new DockerHubViewModel();

    this.$scope.$watch(() => this.model.Registry, this.onRegistryChange);
    this.$scope.$watch(() => this.model.Image, this.onImageChange);
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
      const registries = _.filter(this.registries, (reg) => this.isKnownRegistry(reg));
      const registryImages = _.flatMap(registries, (registry) => _.filter(this.images, (image) => _.includes(image, registry.URL)));
      const imagesWithoutKnown = _.difference(this.images, registryImages);
      images = _.filter(imagesWithoutKnown, (image) => !this.ImageHelper.imageContainsURL(image));
    }
    this.availableImages = images;
  }

  isDockerHubRegistry() {
    return this.model.UseRegistry && (this.model.Registry.Type === RegistryTypes.DOCKERHUB || this.model.Registry.Type === RegistryTypes.ANONYMOUS);
  }

  async onRegistryChange() {
    this.prepareAutocomplete();
    if (this.model.Registry.Type === RegistryTypes.GITLAB && this.model.Image) {
      this.model.Image = _.replace(this.model.Image, this.model.Registry.Gitlab.ProjectPath, '');
    }
  }

  async onImageChange() {
    if (!this.isDockerHubRegistry()) {
      this.setValidity(true);
    }
  }

  displayedRegistryURL() {
    return this.getRegistryURL(this.model.Registry) || 'docker.io';
  }

  async reloadRegistries() {
    return this.$async(async () => {
      try {
        let showDefaultRegistry = false;
        this.registries = await this.EndpointService.registries(this.endpoint.Id, this.namespace);

        // Sort the registries by Name
        this.registries.sort((a, b) => a.Name.localeCompare(b.Name));

        // hide default(anonymous) dockerhub registry if user has an authenticated one
        if (!this.registries.some((registry) => registry.Type === RegistryTypes.DOCKERHUB)) {
          showDefaultRegistry = true;
          // Add dockerhub on top
          this.registries.splice(0, 0, this.defaultRegistry);
        }

        const id = this.model.Registry.Id;
        const registry = _.find(this.registries, { Id: id });
        if (!registry) {
          this.model.Registry = showDefaultRegistry ? this.defaultRegistry : this.registries[0];
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registries');
      }
    });
  }

  async loadImages() {
    return this.$async(async () => {
      try {
        if (!this.autoComplete) {
          this.images = [];
          return;
        }

        const images = await this.ImageService.images();
        this.images = this.ImageService.getUniqueTagListFromImages(images);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve images');
      }
    });
  }

  $onChanges({ namespace, endpoint }) {
    if ((namespace || endpoint) && this.endpoint.Id) {
      this.reloadRegistries();
    }
  }

  $onInit() {
    return this.$async(async () => {
      await this.loadImages();
    });
  }
}

export default porImageRegistryController;
angular.module('portainer.docker').controller('porImageRegistryController', porImageRegistryController);
