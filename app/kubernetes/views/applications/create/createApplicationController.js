import angular from 'angular';
import {
  KubernetesApplicationDeploymentTypes,
  KubernetesApplicationEnvironmentVariableFormValue,
  KubernetesApplicationFormValues,
  KubernetesApplicationPersistedFolderFormValue,
  KubernetesApplicationPublishedPortFormValue,
  KubernetesApplicationPublishingTypes
} from 'Kubernetes/models/application';

class KubernetesCreateApplicationController {
  /* @ngInject */
  constructor($async, $state, Notifications, EndpointProvider, KubernetesResourcePoolService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.EndpointProvider = EndpointProvider;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesApplicationService = KubernetesApplicationService;

    this.onInit = this.onInit.bind(this);
    this.deployApplicationAsync = this.deployApplicationAsync.bind(this);
  }

  addEnvironmentVariable() {
    this.formValues.EnvironmentVariables.push(new KubernetesApplicationEnvironmentVariableFormValue());
  }

  removeEnvironmentVariable(index) {
    this.formValues.EnvironmentVariables.splice(index, 1);
  }

  hasEnvironmentVariables() {
    return this.formValues.EnvironmentVariables.length > 0;
  }

  addPersistedFolder() {
    let storageClass = '';
    if (this.storageClasses.length === 1) {
      storageClass = this.storageClasses[0];
    }

    this.formValues.PersistedFolders.push(new KubernetesApplicationPersistedFolderFormValue(storageClass));
  }

  removePersistedFolder(index) {
    this.formValues.PersistedFolders.splice(index, 1);
  }

  addPublishedPort() {
    this.formValues.PublishedPorts.push(new KubernetesApplicationPublishedPortFormValue());
  }

  removePublishedPort(index) {
    this.formValues.PublishedPorts.splice(index, 1);
  }

  storageClassAvailable() {
    return this.storageClasses && this.storageClasses.length > 0;
  }

  hasMultipleStorageClassesAvailable() {
    return this.storageClasses && this.storageClasses.length > 1;
  }

  publishViaLoadBalancerEnabled() {
    return this.state.useLoadBalancer;
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
        useLoadBalancer: false
      };

      this.ApplicationDeploymentTypes = KubernetesApplicationDeploymentTypes;
      this.ApplicationPublishingTypes = KubernetesApplicationPublishingTypes;
      this.resourcePools = await this.KubernetesResourcePoolService.resourcePools();
      this.formValues.ResourcePool = this.resourcePools[0];

      const endpoint = this.EndpointProvider.currentEndpoint();
      this.storageClasses = endpoint.Kubernetes.Configuration.StorageClasses;
      this.state.useLoadBalancer = endpoint.Kubernetes.Configuration.UseLoadBalancer;

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
