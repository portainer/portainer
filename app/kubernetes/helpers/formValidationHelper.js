import _ from 'lodash-es';

class KubernetesFormValidationHelper {
  static getDuplicates(names) {
    const groupped = _.groupBy(names);
    const res = {};
    _.forEach(names, (name, index) => {
      if (groupped[name].length > 1) {
        res[index] = name;
      }
    });
    return res;
  }
}
export default KubernetesFormValidationHelper;