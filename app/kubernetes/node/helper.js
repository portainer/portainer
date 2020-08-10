import _ from 'lodash-es';

export class KubernetesNodeHelper {
  static isSystemLabel(label) {
    return !label.IsNew && (_.startsWith(label.Key, 'beta.kubernetes.io') || _.startsWith(label.Key, 'kubernetes.io') || label.Key === 'node-role.kubernetes.io/master');
  }

  static reorderLabels(labels) {
    return _.sortBy(labels, (label) => {
      return !KubernetesNodeHelper.isSystemLabel(label);
    });
  }
}
