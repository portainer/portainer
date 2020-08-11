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

  static computeUsedLabels(applications, labels) {
    const pods = _.flatten(_.map(applications, 'Pods'));
    const nodeSelectors = _.uniq(_.flatten(_.map(pods, 'NodeSelector')));

    return _.map(labels, (label) => {
      label.IsUsed = _.find(nodeSelectors, (ns) => ns && ns[label.Key] === label.Value) ? true : false;
      return label;
    });
  }
}
