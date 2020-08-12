import _ from 'lodash-es';
import angular from 'angular';
import { KubernetesStorageClassAccessPolicies, KubernetesStorageClass } from 'Kubernetes/models/storage-class/models';

class KubernetesConfigureController {
  /* @ngInject */
  constructor($async, $state, $stateParams, Notifications, KubernetesStorageService, EndpointService, EndpointProvider) {
    this.$async = $async;
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.Notifications = Notifications;
    this.KubernetesStorageService = KubernetesStorageService;
    this.EndpointService = EndpointService;
    this.EndpointProvider = EndpointProvider;

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
      const classes = _.without(
        _.map(this.StorageClasses, (item) => {
          if (item.selected) {
            const res = new KubernetesStorageClass();
            res.Name = item.Name;
            res.AccessModes = _.map(item.AccessModes, 'Name');
            res.Provisioner = item.Provisioner;
            res.AllowVolumeExpansion = item.AllowVolumeExpansion;
            return res;
          }
        }),
        undefined
      );

      this.endpoint.Kubernetes.Configuration.StorageClasses = classes;
      this.endpoint.Kubernetes.Configuration.UseLoadBalancer = this.formValues.UseLoadBalancer;
      this.endpoint.Kubernetes.Configuration.UseServerMetrics = this.formValues.UseServerMetrics;
      this.endpoint.Kubernetes.Configuration.UseIngress = this.formValues.UseIngress;
      if (this.formValues.UseIngress) {
        this.endpoint.Kubernetes.Configuration.IngressClasses = _.split(this.formValues.IngressClasses, ',');
      }
      await this.EndpointService.updateEndpoint(this.endpoint.Id, this.endpoint);

      const storagePromises = _.map(classes, (storageClass) => {
        const oldStorageClass = _.find(this.oldStorageClasses, { Name: storageClass.Name });
        if (oldStorageClass) {
          return this.KubernetesStorageService.patch(this.state.endpointId, oldStorageClass, storageClass);
        }
      });

      await Promise.all(storagePromises);

      const endpoints = this.EndpointProvider.endpoints();
      const modifiedEndpoint = _.find(endpoints, (item) => item.Id === this.endpoint.Id);
      if (modifiedEndpoint) {
        modifiedEndpoint.Kubernetes.Configuration.StorageClasses = classes;
        modifiedEndpoint.Kubernetes.Configuration.UseLoadBalancer = this.formValues.UseLoadBalancer;
        modifiedEndpoint.Kubernetes.Configuration.UseServerMetrics = this.formValues.UseServerMetrics;
        modifiedEndpoint.Kubernetes.Configuration.UseIngress = this.formValues.UseIngress;
        if (this.formValues.UseIngress) {
          modifiedEndpoint.Kubernetes.Configuration.IngressClasses = _.split(this.formValues.IngressClasses, ',');
        }
        this.EndpointProvider.setEndpoints(endpoints);
      }
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
    this.state = {
      actionInProgress: false,
      displayConfigureClassPanel: {},
      viewReady: false,
      endpointId: this.$stateParams.id,
    };

    this.formValues = {
      UseLoadBalancer: false,
      UseServerMetrics: false,
      UseIngress: false,
      IngressClasses: '',
    };

    try {
      [this.StorageClasses, this.endpoint] = await Promise.all([this.KubernetesStorageService.get(this.state.endpointId), this.EndpointService.endpoint(this.state.endpointId)]);
      _.forEach(this.StorageClasses, (item) => {
        item.availableAccessModes = new KubernetesStorageClassAccessPolicies();
        const storage = _.find(this.endpoint.Kubernetes.Configuration.StorageClasses, (sc) => sc.Name === item.Name);
        if (storage) {
          item.selected = true;
          _.forEach(storage.AccessModes, (access) => {
            const mode = _.find(item.availableAccessModes, { Name: access });
            if (mode) {
              mode.selected = true;
            }
          });
        }
      });

      this.oldStorageClasses = angular.copy(this.StorageClasses);

      this.formValues.UseLoadBalancer = this.endpoint.Kubernetes.Configuration.UseLoadBalancer;
      this.formValues.UseServerMetrics = this.endpoint.Kubernetes.Configuration.UseServerMetrics;
      this.formValues.UseIngress = this.endpoint.Kubernetes.Configuration.UseIngress;
      this.formValues.IngressClasses = _.join(this.endpoint.Kubernetes.Configuration.IngressClasses);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve endpoint configuration');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesConfigureController;
angular.module('portainer.kubernetes').controller('KubernetesConfigureController', KubernetesConfigureController);
