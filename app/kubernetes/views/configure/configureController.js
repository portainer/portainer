import _ from 'lodash-es';
import angular from 'angular';
import { KubernetesStorageClassAccessPolicies, KubernetesStorageClass } from 'Kubernetes/models/storage-class/models';

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

  storageClassAvailable() {
    return this.StorageClasses && this.StorageClasses.length > 0;
  }

  hasValidStorageConfiguration() {
    let valid = true;
    _.forEach(this.StorageClasses, (item) => {
      if (item.selected && item.AccessModes.length === 0) {
        valid = false;
      }
    });

    return valid;
  }

  async configureAsync() {
    try {
      this.state.actionInProgress = true;
      const classes = _.without(_.map(this.StorageClasses, (item) => {
        if (item.selected) {
          const res = new KubernetesStorageClass();
          res.Name = item.Name;
          res.AccessModes = _.map(item.AccessModes, "Name");
          return res;
        }
      }), undefined);

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
    return this.$async(this.configureAsync);
  }

  async onInit() {
    try {
      const endpointId = this.$stateParams.id;
      [this.StorageClasses, this.endpoint] = await Promise.all([this.KubernetesStorageService.get(endpointId), this.EndpointService.endpoint(endpointId)]);
      _.forEach(this.StorageClasses, (item) => {
        item.availableAccessModes = new KubernetesStorageClassAccessPolicies();
        const storage = _.find(this.endpoint.Kubernetes.Configuration.StorageClasses, (sc) => sc.Name === item.Name);
        if (storage) {
          item.selected = true;
          _.forEach(storage.AccessModes, (access) => {
            const mode = _.find(item.availableAccessModes, {Name: access});
            if (mode) {
              mode.selected = true;
            }
          });
        }
      });

      this.formValues.UseLoadBalancer = this.endpoint.Kubernetes.Configuration.UseLoadBalancer;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve storage classes');
    }
  }

  $onInit() {
    this.formValues = {
      UseLoadBalancer: false
    };
    this.state = {
      actionInProgress: false,
      displayConfigureClassPanel: {}
    };
    return this.$async(this.onInit);
  }
}

export default KubernetesConfigureController;
angular.module('portainer.kubernetes').controller('KubernetesConfigureController', KubernetesConfigureController);
