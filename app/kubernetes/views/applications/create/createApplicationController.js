import angular from 'angular';
import {
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationFormValues,
  KubernetesApplicationPublishingTypes
} from 'Kubernetes/models/application';

class KubernetesCreateApplicationController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesResourcePoolService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.deployApplicationAsync = this.deployApplicationAsync.bind(this);
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

  async deployApplicationAsync() {
    this.state.actionInProgress = true;
    try {
      await this.KubernetesApplicationService.create(this.formValues);
      this.Notifications.success('Application successfully deployed', this.formValues.Name);
      this.$state.go('kubernetes.applications');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create application');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  deployApplication() {
    return this.$async(this.deployApplicationAsync);
  }

  async onInit() {
    try {
      this.formValues = new KubernetesApplicationFormValues();

      this.state = {
        actionInProgress: false,
      };

      this.ApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
      this.ApplicationPublishingTypes = KubernetesApplicationPublishingTypes;

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
