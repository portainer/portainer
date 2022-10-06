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
    const grouped = _.groupBy(names);
    const res = {};
    _.forEach(names, (name, index) => {
      if (name && grouped[name].length > 1) {
        res[index] = name;
      }
    });
    return res;
  }

  static getDuplicateNodePorts(serviceNodePorts, allOtherNodePorts) {
    const res = {};
    serviceNodePorts.forEach((sNodePort, index) => {
      if (allOtherNodePorts.includes(sNodePort) || serviceNodePorts.filter((snp) => snp === sNodePort).length > 1) {
        res[index] = sNodePort;
      }
    });
    return res;
  }
}
export default KubernetesFormValidationHelper;
