import angular from 'angular';
import _ from 'lodash-es';
import {KubernetesConfigurationFormValues, KubernetesConfigurationFormValuesDataEntry} from 'Kubernetes/models/configuration/formvalues';
import {KubernetesConfigurationTypes} from 'Kubernetes/models/configuration/models';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';

class KubernetesCreateConfigurationController {
  /* @ngInject */
  constructor($async, $state, Notifications, Authentication, KubernetesConfigurationService, KubernetesResourcePoolService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.Authentication = Authentication;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesConfigurationTypes = KubernetesConfigurationTypes;

    this.onInit = this.onInit.bind(this);
    this.createConfigurationAsync = this.createConfigurationAsync.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
    this.editorUpdateAsync = this.editorUpdateAsync.bind(this);
    this.getConfigurationsAsync = this.getConfigurationsAsync.bind(this);
    this.onFileLoad = this.onFileLoad.bind(this);
    this.onFileLoadAsync = this.onFileLoadAsync.bind(this);
  }

  onChangeName() {
    const filteredConfigurations = _.filter(this.configurations, (config) => config.Namespace === this.formValues.ResourcePool.Namespace.Name);
    this.state.alreadyExist = _.find(filteredConfigurations, (config) => config.Name === this.formValues.Name) !== undefined;
  }

  onChangeKey() {
    this.state.duplicateKeys = KubernetesFormValidationHelper.getDuplicates(_.map(this.formValues.Data, 'Key'));
    this.state.hasDuplicateKeys = Object.keys(this.state.duplicateKeys).length > 0;
  }

  addEntry() {
    this.formValues.Data.push(new KubernetesConfigurationFormValuesDataEntry());
  }

  removeEntry(index) {
    this.formValues.Data.splice(index, 1);
    this.onChangeKey();
  }

  // TODO: review - don't use async function (cf docker/createConfigController for working 'cm' use)
  async editorUpdateAsync(cm) {
    this.formValues.DataYaml = await cm.getValue();
  }

  editorUpdate(cm) {
    return this.$async(this.editorUpdateAsync, cm);
  }

  isFormValid() {
    const uniqueCheck = !this.state.alreadyExist && !this.state.hasDuplicateKeys;
    if (this.formValues.IsSimple) {
      return this.formValues.Data.length > 0 && uniqueCheck;
    }
    return uniqueCheck;
  }

  async onFileLoadAsync(event) {
    const entry = new KubernetesConfigurationFormValuesDataEntry();
    entry.Key = event.target.fileName;
    entry.Value = event.target.result;
    this.formValues.Data.push(entry);
    this.onChangeKey();
  }

  onFileLoad(event) {
    return this.$async(this.onFileLoadAsync, event);
  }

  addEntryFromFile(file) {
    if (file) {
      const temporaryFileReader = new FileReader();
      temporaryFileReader.fileName = file.name;
      temporaryFileReader.onload = this.onFileLoad;
      temporaryFileReader.readAsText(file);
    }
  }

  async createConfigurationAsync() {
    try {
      this.state.actionInProgress = true;
      this.formValues.ConfigurationOwner = this.Authentication.getUserDetails().username;
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

  async getConfigurationsAsync() {
    try {
      this.configurations = await this.KubernetesConfigurationService.get();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve configurations');
    }
  }

  getConfigurations() {
    return this.$async(this.getConfigurationsAsync)
  }

  async onInit() {
    this.state = {
      actionInProgress: false,
      viewReady: false,
      alreadyExist: false,
      duplicateKeys: {},
      hasDuplicateKeys: false
    };

    this.formValues = new KubernetesConfigurationFormValues();
    this.formValues.Data.push(new KubernetesConfigurationFormValuesDataEntry());

    try {
      this.resourcePools = await this.KubernetesResourcePoolService.get();
      this.formValues.ResourcePool = this.resourcePools[0];
      await this.getConfigurations();
    } catch(err) {
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
