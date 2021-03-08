import _ from 'lodash-es';

class KubernetesCommonHelper {
  static assignOrDeleteIfEmpty(obj, path, value) {
    if (!value || (value instanceof Array && !value.length)) {
      _.unset(obj, path);
    } else {
      _.set(obj, path, value);
    }
  }

  static ownerToLabel(owner) {
    let label = _.replace(owner, /[^-A-Za-z0-9_.]/g, '.');
    label = _.truncate(label, { length: 63, omission: '' });
    label = _.replace(label, /^[-_.]*/g, '');
    label = _.replace(label, /[-_.]*$/g, '');
    return label;
  }

  static assignOrDeleteIfEmptyOrZero(obj, path, value) {
    if (!value || value === 0 || (value instanceof Array && !value.length)) {
      _.unset(obj, path);
    } else {
      _.set(obj, path, value);
    }
  }
}
export default KubernetesCommonHelper;
