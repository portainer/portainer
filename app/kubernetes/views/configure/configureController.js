import _ from 'lodash-es';
import angular from 'angular';

class KubernetesConfigureController {
  /* @ngInject */
  constructor($async, $state, $stateParams, Notifications, KubernetesStorageService, EndpointService) {
    this.$async = $async;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.Notifications = Notifications;
    this.KubernetesStorageService = KubernetesStorageService;
    this.EndpointService = EndpointService;

    this.onInit = this.onInit.bind(this);
    this.configureAsync = this.configureAsync.bind(this);
  }

  async configureAsync() {
    try {
      this.state.actionInProgress = true;
      const classes = _.without(_.map(this.formValues.selectedClasses, (value, key) => value ? key : ''), '');
      this.endpoint.Kubernetes.Configuration.StorageClasses = classes;
      this.endpoint.Kubernetes.Configuration.UseLoadBalancer = this.formValues.UseLoadBalancer;
      await this.EndpointService.updateEndpoint(this.endpoint.Id, this.endpoint);
      this.Notifications.success('Configuration successfully applied');
      this.$state.go('portainer.home');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to apply configuration');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  configure() {
    return this.$async(this.configureAsync)
  }


  async onInit() {
    try {
      const endpointId = this.$stateParams.id;
      [this.availableClasses, this.endpoint] = await Promise.all([this.KubernetesStorageService.storageClasses(endpointId), this.EndpointService.endpoint(endpointId)]);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve storage classes');
    }
  }

  $onInit() {
    this.formValues = {
      UseLoadBalancer: false
    };
    this.state = {
      actionInProgress: false
    };
    return this.$async(this.onInit);
  }
}

export default KubernetesConfigureController;
angular.module('portainer.kubernetes').controller('KubernetesConfigureController', KubernetesConfigureController);
