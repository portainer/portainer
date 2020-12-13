import angular from 'angular';
import _ from 'lodash-es';
import { KubernetesConfigurationFormValuesDataEntry } from 'Kubernetes/models/configuration/formvalues';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import YAML from 'yaml';

class KubernetesConfigurationDataController {
  /* @ngInject */
  constructor($async) {
    this.$async = $async;

    this.editorUpdate = this.editorUpdate.bind(this);
    this.editorUpdateAsync = this.editorUpdateAsync.bind(this);
    this.onFileLoad = this.onFileLoad.bind(this);
    this.onFileLoadAsync = this.onFileLoadAsync.bind(this);
    this.showSimpleMode = this.showSimpleMode.bind(this);
    this.showAdvancedMode = this.showAdvancedMode.bind(this);
  }

  onChangeKey() {
    this.state.duplicateKeys = KubernetesFormValidationHelper.getDuplicates(_.map(this.formValues.Data, (data) => data.Key));
    this.isValid = Object.keys(this.state.duplicateKeys).length === 0;
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

  showSimpleMode() {
    this.formValues.IsSimple = true;
    YAML.defaultOptions.customTags = ['binary'];
    const data = YAML.parse(this.formValues.DataYaml);
    this.formValues.Data = _.map(data, (value, key) => {
      const entry = new KubernetesConfigurationFormValuesDataEntry();
      entry.Key = key;
      entry.Value = value;
      return entry;
    });
  }

  showAdvancedMode() {
    this.formValues.IsSimple = false;
    const data = _.reduce(
      this.formValues.Data,
      (acc, entry) => {
        acc[entry.Key] = entry.Value;
        return acc;
      },
      {}
    );
    this.formValues.DataYaml = YAML.stringify(data);
  }

  $onInit() {
    this.state = {
      duplicateKeys: {},
    };
  }
}

export default KubernetesConfigurationDataController;
angular.module('portainer.kubernetes').controller('KubernetesConfigurationDataController', KubernetesConfigurationDataController);
