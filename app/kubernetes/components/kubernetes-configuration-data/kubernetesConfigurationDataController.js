import { Buffer } from 'buffer';
import angular from 'angular';
import _ from 'lodash-es';
import chardet from 'chardet';
import { Base64 } from 'js-base64';
import KubernetesFormValidationHelper from 'Kubernetes/helpers/formValidationHelper';
import KubernetesConfigurationHelper from 'Kubernetes/helpers/configurationHelper';
import { KubernetesConfigurationFormValuesEntry } from 'Kubernetes/models/configuration/formvalues';
import { KubernetesConfigurationKinds, KubernetesSecretTypeOptions } from 'Kubernetes/models/configuration/models';

class KubernetesConfigurationDataController {
  /* @ngInject */
  constructor($async, Notifications) {
    Object.assign(this, { $async, Notifications });

    this.editorUpdate = this.editorUpdate.bind(this);
    this.editorUpdateAsync = this.editorUpdateAsync.bind(this);
    this.onFileLoad = this.onFileLoad.bind(this);
    this.onFileLoadAsync = this.onFileLoadAsync.bind(this);
    this.showSimpleMode = this.showSimpleMode.bind(this);
    this.showAdvancedMode = this.showAdvancedMode.bind(this);
    this.KubernetesConfigurationKinds = KubernetesConfigurationKinds;
    this.KubernetesSecretTypeOptions = KubernetesSecretTypeOptions;
  }

  onChangeKey(entry) {
    if (entry && entry.Used) {
      return;
    }

    this.onChangeValidation();

    this.state.duplicateKeys = KubernetesFormValidationHelper.getDuplicates(_.map(this.formValues.Data, (data) => data.Key));
    this.state.invalidKeys = KubernetesFormValidationHelper.getInvalidKeys(_.map(this.formValues.Data, (data) => data.Key));
    this.isValid = Object.keys(this.state.duplicateKeys).length === 0 && Object.keys(this.state.invalidKeys).length === 0;
  }

  addEntry() {
    this.formValues.Data.push(new KubernetesConfigurationFormValuesEntry());

    // logic for setting required keys for new entries, based on the secret type
    if (this.formValues.Kind === this.KubernetesConfigurationKinds.SECRET) {
      const newDataIndex = this.formValues.Data.length - 1;
      switch (this.formValues.Type) {
        case this.KubernetesSecretTypeOptions.DOCKERCFG.value:
          this.addMissingKeys(['dockercfg'], newDataIndex);
          break;
        case this.KubernetesSecretTypeOptions.DOCKERCONFIGJSON.value:
          this.addMissingKeys(['.dockerconfigjson'], newDataIndex);
          break;
        case this.KubernetesSecretTypeOptions.BASICAUTH.value:
          // only add a required key if there is no required key out of username and password
          if (!this.formValues.Data.some((entry) => entry.Key === 'username' || entry.Key === 'password')) {
            this.addMissingKeys(['username', 'password'], newDataIndex);
          }
          break;
        case this.KubernetesSecretTypeOptions.SSHAUTH.value:
          this.addMissingKeys(['ssh-privatekey'], newDataIndex);
          break;
        case this.KubernetesSecretTypeOptions.TLS.value:
          this.addMissingKeys(['tls.crt', 'tls.key'], newDataIndex);
          break;
        case this.KubernetesSecretTypeOptions.BOOTSTRAPTOKEN.value:
          this.addMissingKeys(['token-id', 'token-secret'], newDataIndex);
          break;
        default:
          break;
      }
    }

    this.onChangeValidation();
  }

  // addMissingKeys adds the keys in the keys array to the entry at the index provided and stops when the first one is added
  addMissingKeys(keys, newDataIndex) {
    for (let key of keys) {
      if (this.formValues.Data.every((entry) => entry.Key !== key)) {
        this.formValues.Data[newDataIndex].Key = key;
        return;
      }
    }
  }

  isRequiredKey(key) {
    if (this.formValues.Kind === this.KubernetesConfigurationKinds.SECRET) {
      switch (this.formValues.Type) {
        case this.KubernetesSecretTypeOptions.DOCKERCONFIGJSON.value:
          if (key === '.dockerconfigjson') {
            return true;
          }
          break;
        case this.KubernetesSecretTypeOptions.DOCKERCFG.value:
          if (key === '.dockercfg') {
            return true;
          }
          break;
        case this.KubernetesSecretTypeOptions.SSHAUTH.value:
          if (key === 'ssh-privatekey') {
            return true;
          }
          break;
        case this.KubernetesSecretTypeOptions.TLS.value:
          if (key === 'tls.crt' || key === 'tls.key') {
            return true;
          }
          break;
        case this.KubernetesSecretTypeOptions.BOOTSTRAPTOKEN.value:
          if (key === 'token-id' || key === 'token-secret') {
            return true;
          }
          break;
        default:
          break;
      }
    }
    return false;
  }

  removeEntry(index, entry) {
    if (entry.Used) {
      return;
    }

    this.formValues.Data.splice(index, 1);
    this.onChangeKey();
  }

  async editorUpdateAsync(value) {
    if (this.formValues.DataYaml !== value) {
      this.formValues.DataYaml = value;
      this.isEditorDirty = true;
    }
  }

  editorUpdate(value) {
    return this.$async(this.editorUpdateAsync, value);
  }

  async onFileLoadAsync(event) {
    // exit if the file is too big
    const maximumFileSizeBytes = 1024 * 1024; // 1MB
    if (event.target.result.byteLength > maximumFileSizeBytes) {
      this.Notifications.error('File size is too big', 'File size is too big', 'Select a file that is 1MB or smaller.');
      return;
    }

    const entry = new KubernetesConfigurationFormValuesEntry();
    try {
      const encoding = chardet.detect(Buffer.from(event.target.result));
      const decoder = new TextDecoder(encoding);

      entry.IsBinary = KubernetesConfigurationHelper.isBinary(encoding);

      if (!entry.IsBinary) {
        entry.Value = decoder.decode(event.target.result);
      } else {
        const stringValue = decoder.decode(event.target.result);
        entry.Value = Base64.encode(stringValue);
      }
    } catch (error) {
      this.Notifications.error('Failed to upload file', error, 'Failed to upload file');
      return;
    }

    entry.Key = event.target.fileName;

    if (this.formValues.Kind === this.KubernetesConfigurationKinds.SECRET) {
      if (this.isDockerConfig) {
        if (this.formValues.Type === this.KubernetesSecretTypeOptions.DOCKERCFG.value) {
          entry.Key = '.dockercfg';
        } else {
          entry.Key = '.dockerconfigjson';
        }
      }

      if (this.formValues.Type === this.KubernetesSecretTypeOptions.TLS.value) {
        const isCrt = entry.Value.indexOf('BEGIN CERTIFICATE') !== -1;
        if (isCrt) {
          entry.Key = 'tls.crt';
        }
        const isKey = entry.Value.indexOf('PRIVATE KEY') !== -1;
        if (isKey) {
          entry.Key = 'tls.key';
        }
      }
    }

    // if this.formValues.Data has a key that matches an existing key, then replace it
    const existingEntryIndex = this.formValues.Data.findIndex((data) => data.Key === entry.Key || (data.Value === '' && data.Key === ''));
    if (existingEntryIndex !== -1) {
      this.formValues.Data[existingEntryIndex] = entry;
    } else {
      this.formValues.Data.push(entry);
    }

    this.onChangeKey();
  }

  isEntryRequired() {
    if (this.formValues.Kind === this.KubernetesConfigurationKinds.SECRET) {
      if (this.formValues.Data.length === 1) {
        if (this.formValues.Type !== this.KubernetesSecretTypeOptions.SERVICEACCOUNTTOKEN.value) {
          return true;
        }
      }
    }
    return false;
  }

  onFileLoad(event) {
    return this.$async(this.onFileLoadAsync, event);
  }

  addEntryFromFile(file) {
    if (file) {
      const temporaryFileReader = new FileReader();
      temporaryFileReader.fileName = file.name;
      temporaryFileReader.onload = this.onFileLoad;
      temporaryFileReader.readAsArrayBuffer(file);
    }
  }

  showSimpleMode() {
    this.formValues.IsSimple = true;
    this.formValues.Data = KubernetesConfigurationHelper.parseYaml(this.formValues);
    this.onChangeKey();
  }

  showAdvancedMode() {
    this.formValues.IsSimple = false;
    this.formValues.DataYaml = KubernetesConfigurationHelper.parseData(this.formValues);
  }

  $onInit() {
    this.state = {
      duplicateKeys: [],
      invalidKeys: {},
    };
  }
}

export default KubernetesConfigurationDataController;
angular.module('portainer.kubernetes').controller('KubernetesConfigurationDataController', KubernetesConfigurationDataController);
