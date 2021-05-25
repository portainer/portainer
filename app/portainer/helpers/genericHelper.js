import _ from 'lodash-es';

class GenericHelper {
  static findDeepAll(obj, target, res = []) {
    if (typeof obj === 'object') {
      _.forEach(obj, (child, key) => {
        if (key === target) res.push(child);
        if (typeof child === 'object') GenericHelper.findDeepAll(child, target, res);
      });
    }
    return res;
  }
}

export default GenericHelper;
