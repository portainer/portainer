import angular from 'angular';
import {ApplicationDeploymentTypes, ApplicationPublishingTypes} from 'Kubernetes/models/application';

class KubernetesCreateApplicationController {
  /* @ngInject */
  constructor($async, $state, KubernetesResourcePoolService) {
    this.$async = $async;
    this.$state = $state;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.onInit = this.onInit.bind(this);
  }

  addEnvironmentVariable() {
    const envVar = {
      Name: '',
      Value: '',
      IsSecret: false
    };

    this.formValues.EnvironmentVariables.push(envVar);
  }

  removeEnvironmentVariable(index) {
    this.formValues.EnvironmentVariables.splice(index, 1);
  }

  hasEnvironmentVariables() {
    return this.formValues.EnvironmentVariables.length > 0;
  }

  addPersistedFolder() {
    const persistedFolder = {
      ContainerPath: '',
      Size: '',
      StorageClass: ''
    };

    this.formValues.PersistedFolders.push(persistedFolder);
  }

  removePersistedFolder(index) {
    this.formValues.PersistedFolders.splice(index, 1);
  }

  addPublishedPort() {
    const publishedPort = {
      ContainerPort: '',
      NodePort: '',
      LoadBalancerPort: '',
      Protocol: 'tcp'
    };

    this.formValues.PublishedPorts.push(publishedPort);
  }

  removePublishedPort(index) {
    this.formValues.PublishedPorts.splice(index, 1);
  }

  // TODO: temporary mock, should be updated based on endpoint kubernetes configuration
  storageClassAvailable() {
    return true;
  }

  // TODO: temporary mock, should be updated based on endpoint kubernetes configuration
  hasMultipleStorageClassesAvailable() {
    return true;
  }

  // TODO: temporary mock, should be updated based on endpoint kubernetes configuration
  publishViaLoadBalancerEnabled() {
    return true;
  }

  async onInit() {
    try {
      this.formValues = {
        EnvironmentVariables: [],
        PersistedFolders: [],
        PublishedPorts: [],
        MemoryLimit: 0,
        CpuLimit: 0,
      };

      this.state = {
        DeploymentType: ApplicationDeploymentTypes.REPLICATED,
        PublishingType: ApplicationPublishingTypes.INTERNAL,
      };

      this.ApplicationDeploymentTypes = ApplicationDeploymentTypes;
      this.ApplicationPublishingTypes = ApplicationPublishingTypes;

      // TODO: LP validation required
      // Wasn't sure if that should have been part of some other object so I put all these directly in the scope.
      this.resourcePools = await this.KubernetesResourcePoolService.resourcePools();
      this.formValues.ResourcePool = this.resourcePools[0];

      // Part of the endpoint Kubernetes configuration
      this.storageClasses = [];

      this.stacks = [];

    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesCreateApplicationController;
angular.module('portainer.kubernetes').controller('KubernetesCreateApplicationController', KubernetesCreateApplicationController);
