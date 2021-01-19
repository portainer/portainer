import angular from 'angular';
import _ from 'lodash-es';
import { KubernetesConfigurationFormValuesDataEntry } from 'Kubernetes/models/configuration/formvalues';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';

class KubernetesConfigurationDataController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;

    this.editorUpdate = this.editorUpdate.bind(this);
    this.editorUpdateAsync = this.editorUpdateAsync.bind(this);
    this.onFileLoad = this.onFileLoad.bind(this);
    this.onFileLoadAsync = this.onFileLoadAsync.bind(this);
  }

  onChangeKey() {
    this.state.duplicateKeys = KubernetesFormValidationHelper.getDuplicates(_.map(this.formValues.Data, (data) => data.Key));
    this.state.invalidKeys = KubernetesFormValidationHelper.getInvalidKeys(_.map(this.formValues.Data, (data) => data.Key));
    this.isValid = Object.keys(this.state.duplicateKeys).length === 0 && Object.keys(this.state.invalidKeys).length === 0;
  }

  addEntry() {
    this.formValues.Data.push(new KubernetesConfigurationFormValuesDataEntry());
  }

  removeEntry(index) {
    this.formValues.Data.splice(index, 1);
    this.onChangeKey();
  }

  async editorUpdateAsync(cm) {
    this.formValues.DataYaml = cm.getValue();
  }

  editorUpdate(cm) {
    return this.$async(this.editorUpdateAsync, cm);
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

  $onInit() {
    this.state = {
      duplicateKeys: {},
      invalidKeys: {},
    };
  }
}

export default KubernetesConfigurationDataController;
angular.module('portainer.kubernetes').controller('KubernetesConfigurationDataController', KubernetesConfigurationDataController);
