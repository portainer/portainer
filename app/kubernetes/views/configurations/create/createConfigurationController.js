import angular from 'angular';
import {KubernetesConfigurationFormValues, KubernetesConfigurationFormValuesDataEntry} from 'Kubernetes/models/configuration/formvalues';
import {KubernetesConfigurationTypes} from 'Kubernetes/models/configuration/models';

class KubernetesCreateConfigurationController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesConfigurationService, KubernetesResourcePoolService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesConfigurationTypes = KubernetesConfigurationTypes;

    this.onInit = this.onInit.bind(this);
    this.createConfigurationAsync = this.createConfigurationAsync.bind(this);
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

  async createConfigurationAsync() {
    try {
      this.state.actionInProgress = true;
      await this.KubernetesConfigurationService.create(this.formValues);
      this.Notifications.success('Configuration succesfully created');
      this.$state.go('kubernetes.configurations');
    } catch(err) {
      this.Notifications.error('Failure', err, 'Unable to create configuration');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createConfiguration() {
    return this.$async(this.createConfigurationAsync);
  }

  async onInit() {
    try {
      this.formValues = new KubernetesConfigurationFormValues();

      this.state = {
        actionInProgress: false
      };

      this.resourcePools = await this.KubernetesResourcePoolService.get();
      this.formValues.ResourcePool = this.resourcePools[0];
    } catch(err) {
      this.Notifications.error('Failure', err, 'Unable to load view data');
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesCreateConfigurationController;
angular.module('portainer.kubernetes').controller('KubernetesCreateConfigurationController', KubernetesCreateConfigurationController);
