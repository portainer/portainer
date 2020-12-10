import angular from 'angular';
import _ from 'lodash-es';
import { KubernetesConfigurationFormValues, KubernetesConfigurationFormValuesDataEntry } from 'Kubernetes/models/configuration/formvalues';
import { KubernetesConfigurationTypes } from 'Kubernetes/models/configuration/models';

class KubernetesCreateConfigurationController {
  /* @ngInject */
  constructor($async, $state, Notifications, Authentication, KubernetesConfigurationService, KubernetesResourcePoolService, KubernetesNamespaceHelper) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesConfigurationTypes = KubernetesConfigurationTypes;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;

    this.onInit = this.onInit.bind(this);
    this.createConfigurationAsync = this.createConfigurationAsync.bind(this);
    this.getConfigurationsAsync = this.getConfigurationsAsync.bind(this);
  }

  onChangeName() {
    const filteredConfigurations = _.filter(this.configurations, (config) => config.Namespace === this.formValues.ResourcePool.Namespace.Name);
    this.state.alreadyExist = _.find(filteredConfigurations, (config) => config.Name === this.formValues.Name) !== undefined;
  }

  onResourcePoolSelectionChange() {
    this.onChangeName();
  }

  isFormValid() {
    const uniqueCheck = !this.state.alreadyExist && this.state.isDataValid;
    if (this.formValues.IsSimple) {
      return this.formValues.Data.length > 0 && uniqueCheck;
    }
    return uniqueCheck;
  }

  async createConfigurationAsync() {
    try {
      this.state.actionInProgress = true;
      this.formValues.ConfigurationOwner = this.Authentication.getUserDetails().username;
      await this.KubernetesConfigurationService.create(this.formValues);
      this.Notifications.success('Configuration succesfully created');
      this.$state.go('kubernetes.configurations');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create configuration');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createConfiguration() {
    return this.$async(this.createConfigurationAsync);
  }

  async getConfigurationsAsync() {
    try {
      this.configurations = await this.KubernetesConfigurationService.get();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve configurations');
    }
  }

  getConfigurations() {
    return this.$async(this.getConfigurationsAsync);
  }

  async onInit() {
    this.state = {
      actionInProgress: false,
      viewReady: false,
      alreadyExist: false,
      isDataValid: true,
    };

    this.formValues = new KubernetesConfigurationFormValues();
    this.formValues.Data.push(new KubernetesConfigurationFormValuesDataEntry());

    try {
      const resourcePools = await this.KubernetesResourcePoolService.get();
      this.resourcePools = _.filter(resourcePools, (resourcePool) => !this.KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));

      this.formValues.ResourcePool = this.resourcePools[0];
      await this.getConfigurations();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesCreateConfigurationController;
angular.module('portainer.kubernetes').controller('KubernetesCreateConfigurationController', KubernetesCreateConfigurationController);
