import angular from 'angular';
import {KubernetesConfigurationFormValues, KubernetesConfigurationFormValuesDataEntry} from 'Kubernetes/models/configuration/formvalues';
import {KubernetesConfigurationTypes} from 'Kubernetes/models/configuration/models';
import KubernetesConfigurationHelper from 'Kubernetes/helpers/kubernetesConfigurationHelper';
import _ from 'lodash-es';

class KubernetesConfigurationController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesConfigurationService, KubernetesResourcePoolService, ModalService, KubernetesApplicationService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.ModalService = ModalService;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.KubernetesConfigurationTypes = KubernetesConfigurationTypes;

    this.onInit = this.onInit.bind(this);
    this.getConfigurationAsync = this.getConfigurationAsync.bind(this);
    this.getApplicationsAsync = this.getApplicationsAsync.bind(this);
    this.updateConfiguration = this.updateConfiguration.bind(this);
    this.updateConfigurationAsync = this.updateConfigurationAsync.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.editorUpdateAsync = this.editorUpdateAsync.bind(this);
    this.addEntryFromFileAsync = this.addEntryFromFileAsync.bind(this);
  }

  addEntry() {
    this.formValues.Data.push(new KubernetesConfigurationFormValuesDataEntry());
  }

  removeEntry(index) {
    this.formValues.Data.splice(index, 1);
  }

  // TODO: review - don't use async function (cf docker/createConfigController for working 'cm' use)
  async editorUpdateAsync(cm) {
    this.formValues.DataYaml = await cm.getValue();
  }

  editorUpdate(cm) {
    return this.$async(this.editorUpdateAsync, cm);
  }

  // TODO: review - refactor form validation (html should not pass form.$valid as param)
  isFormValid(isValid) {
    if (this.formValues.IsSimple && isValid) {
      return this.formValues.Data.length > 0;
    }
    return isValid;
  }

  // TODO: review - refactor fileReader usage
  readUploadedFileAsText(file) {
    const temporaryFileReader = new FileReader();

    return new Promise((resolve) => {
      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result);
      };
      temporaryFileReader.readAsText(file);
    });
  }

  // TODO: review - refactor without async function
  async addEntryFromFileAsync(file) {
    const entry = new KubernetesConfigurationFormValuesDataEntry();
    entry.Key = file.name;
    entry.Value = await this.readUploadedFileAsText(file);
    this.formValues.Data.push(entry);
  }

  addEntryFromFile(file) {
    return this.$async(this.addEntryFromFileAsync, file);
  }

  async updateConfigurationAsync() {
    try {
      this.state.actionInProgress = true;
      if (this.formValues.Type !== this.configuration.Type || this.formValues.ResourcePool.Namespace.Name !== this.configuration.Namespace || this.formValues.Name !== this.configuration.Name) {
        await this.KubernetesConfigurationService.create(this.formValues);
        await this.KubernetesConfigurationService.delete(this.configuration);
        this.Notifications.success('Configuration succesfully updated');
        this.$state.go('kubernetes.configurations.configuration', {
          namespace: this.formValues.ResourcePool.Namespace.Name,
          name: this.formValues.Name
        }, {reload: true});
      } else {
        await this.KubernetesConfigurationService.update(this.formValues);
        this.Notifications.success('Configuration succesfully updated');
        this.$state.reload();
      }
    } catch(err) {
      this.Notifications.error('Failure', err, 'Unable to update configuration');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  updateConfiguration() {
    if (this.configuration.Used) {
      const plural = this.configuration.Apps.length > 1 ? 's' : '';
      this.ModalService.confirmUpdate(
        `The changes will be propagated to ${this.configuration.Apps.length} running application${plural}. Are you sure you want to update this configuration?`,
        (confirmed) => {
          if (confirmed) {
            return this.$async(this.updateConfigurationAsync);
          }
        }
      );
    } else {
      return this.$async(this.updateConfigurationAsync);
    }
  }

  async getConfigurationAsync() {
    try {
      this.state.configurationLoading = true;
      const name = this.$transition$.params().name;
      const namespace = this.$transition$.params().namespace;
      this.configuration = await this.KubernetesConfigurationService.get(namespace, name);
    } catch(err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve configuration');
    } finally {
      this.state.configurationLoading = false;
    }
  }

  getConfiguration() {
    return this.$async(this.getConfigurationAsync);
  }

  async getApplicationsAsync(namespace) {
    try {
      this.state.applicationsLoading = true;
      this.applications = await this.KubernetesApplicationService.get(namespace);
    } catch(err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve applications');
    } finally {
      this.state.applicationsLoading = false;
    }
  }

  getApplications(namespace) {
    return this.$async(this.getApplicationsAsync, namespace);
  }

  async onInit() {
    try {
      this.formValues = new KubernetesConfigurationFormValues();

      this.state = {
        actionInProgress: false,
        configurationLoading: true,
        applicationsLoading: true
      };

      this.resourcePools = await this.KubernetesResourcePoolService.get();
      await this.getConfiguration();
      await this.getApplications(this.configuration.Namespace);
      this.configuration = KubernetesConfigurationHelper.setConfigurationUsed(this.configuration, this.applications);
      this.formValues.ResourcePool = _.find(this.resourcePools, (resourcePool) => resourcePool.Namespace.Name === this.configuration.Namespace);
      this.formValues.Id = this.configuration.Id;
      this.formValues.Name = this.configuration.Name;
      this.formValues.Type = this.configuration.Type;
      this.formValues.Data = _.map(this.configuration.Data, (value, key) => {
        if (this.configuration.Type === KubernetesConfigurationTypes.SECRET) {
          value = atob(value);
        }
        this.formValues.DataYaml += key + ': ' + value + '\n';
        const entry = new KubernetesConfigurationFormValuesDataEntry();
        entry.Key = key;
        entry.Value = value;
        return entry;
      });
    } catch(err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesConfigurationController;
angular.module('portainer.kubernetes').controller('KubernetesConfigurationController', KubernetesConfigurationController);
