import _ from 'lodash-es';

class KubernetesFormValidationHelper {
  static getInvalidKeys(names) {
    const res = {};
    _.forEach(names, (name, index) => {
      const valid = /^[-._a-zA-Z0-9]+$/.test(name);
      if (!valid) {
        res[index] = true;
      }
    });
    return res;
  }

  static getDuplicates(names) {
    const groupped = _.groupBy(names);
    const res = {};
    _.forEach(names, (name, index) => {
      if (name && groupped[name].length > 1) {
        res[index] = name;
      }
    });
    return res;
  }
}
export default KubernetesFormValidationHelper;
