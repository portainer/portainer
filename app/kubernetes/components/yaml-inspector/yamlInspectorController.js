import angular from 'angular';
import YAML from 'yaml';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

class KubernetesYamlInspectorController {
  /* @ngInject */

  constructor(clipboard) {
    this.clipboard = clipboard;
    this.expanded = false;
  }

  cleanYamlUnwantedFields(yml) {
    try {
      const ymls = yml.split('---');
      const cleanYmls = ymls.map((yml) => {
        const y = YAML.parse(yml);
        if (y.metadata) {
          delete y.metadata.managedFields;
          delete y.metadata.resourceVersion;
        }
        return YAML.stringify(y);
      });
      return cleanYmls.join('---\n');
    } catch (e) {
      return yml;
    }
  }

  copyYAML() {
    this.clipboard.copyText(this.data);
    $('#copyNotificationYAML').show().fadeOut(2500);
  }

  toggleYAMLInspectorExpansion() {
    let selector = 'kubernetes-yaml-inspector code-editor > div.CodeMirror';
    let height = this.expanded ? '500px' : '80vh';
    $(selector).css({ height: height });
    this.expanded = !this.expanded;
  }

  onChange() {
    // placeholder
  }

  $onInit() {
    this.data = this.cleanYamlUnwantedFields(this.data);
    this.limitedFeature = FeatureId.K8S_EDIT_YAML;
  }
}

export default KubernetesYamlInspectorController;
angular.module('portainer.kubernetes').controller('KubernetesYamlInspectorController', KubernetesYamlInspectorController);
