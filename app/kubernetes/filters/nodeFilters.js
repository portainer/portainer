import _ from 'lodash-es';

angular
  .module('portainer.kubernetes')
  .filter('kubernetesNodeStatusColor', function () {
    'use strict';
    return function (text) {
      var status = _.toLower(text);
      switch (status) {
        case 'ready':
          return 'success';
        case 'warning':
          return 'warning';
        default:
          return 'danger';
      }
    };
  })
  .filter('kubernetesNodeConditionsMessage', function () {
    'use strict';
    return function (conditions) {
      if (conditions.MemoryPressure) {
        return 'Node memory is running low';
      }
      if (conditions.PIDPressure) {
        return 'Too many processes running on the node';
      }
      if (conditions.DiskPressure) {
        return 'Node disk capacity is running low';
      }
      if (conditions.NetworkUnavailable) {
        return 'Incorrect node network configuration';
      }
    };
  });
