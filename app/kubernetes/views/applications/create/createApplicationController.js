import angular from 'angular';

class KubernetesCreateApplicationController {
  /* @ngInject */
  constructor($async, $state) {
    this.$async = $async;
    this.$state = $state;

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

  // TODO: LP validation required
  // Wasn't sure if check on length should have been done in the html directly so I created this function.
  hasEnvironmentVariables() {
    return this.formValues.EnvironmentVariables.length > 0;
  }

  // TODO: temporary mock, should be updated based on endpoint kubernetes configuration
  storageClassAvailable() {
    return true;
  }

  // TODO: temporary mock, should be updated based on endpoint kubernetes configuration
  hasMultipleStorageClassesAvailable() {
    return true;
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

  // TODO: LP validation required
  // Wasn't sure if we were going full functions or if check on variables in ng-if still ok in HTML so created a func
  isDeploymentReplicated() {
    return this.state.DeploymentType === 'replicated';
  }

  // Same as above
  isPublishingCluster() {
    return this.state.PublishingType === 'cluster';
  }

  // Same as above
  isPublishingLoadBalancer() {
    return this.state.PublishingType === 'loadbalancer';
  }

  // TODO: temporary mock, should be updated based on endpoint kubernetes configuration
  publishViaLoadBalancerEnabled() {
    return true;
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
        DeploymentType: 'replicated',
        PublishingType: 'internal',
      };

      // TODO: LP validation required
      // Wasn't sure if that should have been part of some other object so I put all these directly in the scope.
      this.resourcePools = [];
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
