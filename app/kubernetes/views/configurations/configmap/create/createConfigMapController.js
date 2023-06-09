import angular from 'angular';
import _ from 'lodash-es';
import { KubernetesConfigurationFormValues, KubernetesConfigurationFormValuesEntry } from 'Kubernetes/models/configuration/formvalues';
import { KubernetesConfigurationKinds } from 'Kubernetes/models/configuration/models';
import KubernetesConfigurationHelper from 'Kubernetes/helpers/configurationHelper';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';
import { getServiceAccounts } from 'Kubernetes/rest/serviceAccount';
import { typeOptions } from '@/react/kubernetes/configs/CreateView/options';

import { confirmWebEditorDiscard } from '@@/modals/confirm';
import { isConfigurationFormValid } from '../../validation';

class KubernetesCreateConfigMapController {
  /* @ngInject */
  constructor($async, $state, $scope, $window, Notifications, Authentication, KubernetesConfigurationService, KubernetesResourcePoolService, EndpointProvider) {
    this.$async = $async;
    this.$state = $state;
    this.$scope = $scope;
    this.$window = $window;
    this.EndpointProvider = EndpointProvider;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesConfigurationKinds = KubernetesConfigurationKinds;

    this.typeOptions = typeOptions;

    this.onInit = this.onInit.bind(this);
    this.createConfigurationAsync = this.createConfigurationAsync.bind(this);
    this.getConfigurationsAsync = this.getConfigurationsAsync.bind(this);
    this.onResourcePoolSelectionChangeAsync = this.onResourcePoolSelectionChangeAsync.bind(this);
  }

  onChangeName() {
    const filteredConfigurations = _.filter(
      this.configurations,
      (config) => config.Namespace === this.formValues.ResourcePool.Namespace.Name && config.Kind === this.formValues.Kind
    );
    this.state.alreadyExist = _.find(filteredConfigurations, (config) => config.Name === this.formValues.Name) !== undefined;
  }

  async onResourcePoolSelectionChangeAsync() {
    try {
      this.onChangeName();
      this.availableServiceAccounts = await getServiceAccounts(this.environmentId, this.formValues.ResourcePool.Namespace.Name);
      this.formValues.ServiceAccountName = this.availableServiceAccounts.length > 0 ? this.availableServiceAccounts[0].metadata.name : '';
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load service accounts');
    }
  }
  onResourcePoolSelectionChange() {
    this.$async(this.onResourcePoolSelectionChangeAsync);
  }

  addRequiredKeysToForm(keys) {
    // remove data entries that have an empty value
    this.formValues.Data = this.formValues.Data.filter((entry) => entry.Value);

    keys.forEach((key) => {
      // if the key doesn't exist on the form, add a new formValues.Data entry
      if (!this.formValues.Data.some((data) => data.Key === key)) {
        this.formValues.Data.push(new KubernetesConfigurationFormValuesEntry());
        const index = this.formValues.Data.length - 1;
        this.formValues.Data[index].Key = key;
      }
    });
  }

  isFormValid() {
    const [isValid] = isConfigurationFormValid(this.state.alreadyExist, this.state.isDataValid, this.formValues);
    return isValid;
  }

  async createConfigurationAsync() {
    try {
      this.state.actionInProgress = true;
      this.formValues.ConfigurationOwner = this.Authentication.getUserDetails().username;
      if (!this.formValues.IsSimple) {
        this.formValues.Data = KubernetesConfigurationHelper.parseYaml(this.formValues);
      }

      await this.KubernetesConfigurationService.create(this.formValues);
      this.Notifications.success('Success', `ConfigMap successfully created`);
      this.state.isEditorDirty = false;
      this.$state.go('kubernetes.configurations', { tab: 'configmaps' });
    } catch (err) {
      this.Notifications.error('Failure', err, `Unable to create ConfigMap`);
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
      this.Notifications.error('Failure', err, 'Unable to retrieve ConfigMaps');
    }
  }

  getConfigurations() {
    return this.$async(this.getConfigurationsAsync);
  }

  async uiCanExit() {
    if (!this.formValues.IsSimple && this.formValues.DataYaml && this.state.isEditorDirty) {
      return confirmWebEditorDiscard();
    }
  }

  async onInit() {
    this.state = {
      actionInProgress: false,
      viewReady: false,
      alreadyExist: false,
      isDataValid: true,
      isEditorDirty: false,
      isDockerConfig: false,
    };

    this.formValues = new KubernetesConfigurationFormValues();
    this.formValues.Kind = KubernetesConfigurationKinds.CONFIGMAP;
    this.formValues.Data = [new KubernetesConfigurationFormValuesEntry()];

    try {
      const resourcePools = await this.KubernetesResourcePoolService.get();
      this.resourcePools = _.filter(
        resourcePools,
        (resourcePool) => !KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name) && resourcePool.Namespace.Status === 'Active'
      );

      this.formValues.ResourcePool = this.resourcePools[0];
      if (!this.formValues.ResourcePool) {
        return;
      }

      await this.getConfigurations();

      this.environmentId = this.EndpointProvider.endpointID();
      this.availableServiceAccounts = await getServiceAccounts(this.environmentId, this.resourcePools[0].Namespace.Name);
      this.formValues.ServiceAccountName = this.availableServiceAccounts.length > 0 ? this.availableServiceAccounts[0].metadata.name : '';
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    } finally {
      this.state.viewReady = true;
    }

    this.$window.onbeforeunload = () => {
      if (!this.formValues.IsSimple && this.formValues.DataYaml && this.state.isEditorDirty) {
        return '';
      }
    };
  }

  $onDestroy() {
    this.state.isEditorDirty = false;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesCreateConfigMapController;
angular.module('portainer.kubernetes').controller('KubernetesCreateConfigMapController', KubernetesCreateConfigMapController);
