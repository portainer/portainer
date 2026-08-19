import _ from 'lodash-es';

class DockerNetworkHelper {
  static getIPV4Configs(configs) {
    return _.filter(configs, (config) => /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/.test(config.Subnet));
  }

  static getIPV6Configs(configs) {
    return _.without(configs, ...DockerNetworkHelper.getIPV4Configs(configs));
  }
}

export default DockerNetworkHelper;
