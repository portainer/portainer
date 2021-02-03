import _ from 'lodash-es';
import * as YAML from 'js-yaml';

class KubernetesYamlHelper {
  static parse(yaml) {
    return YAML.loadAll(yaml);
  }
}

export default KubernetesYamlHelper;
