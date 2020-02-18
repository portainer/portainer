import _ from 'lodash-es';

angular.module('portainer.kubernetes')
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
  .filter('kubernetesNodeConditionStatusBadge', function () {
    'use strict';
    return function (status, type) {
      switch (type) {
        case 'Ready':
          switch (status) {
            case 'True':
              return 'fa-check green-icon'
            case 'False':
              return 'fa-exclamation-triangle red-icon'
            case 'Unknown':
              return 'fa-exclamation-circle orange-icon'
          }
          break;
        case 'OutOfDisk':
        case 'MemoryPressure':
        case 'PIDPressure':
        case 'DiskPressure':
        case 'NetworkUnavailable':
          switch (status) {
            case 'True':
              return 'fa-exclamation-circle orange-icon'
            case 'False':
              return 'fa-check green-icon'
          }
          break;
        default:
          return 'fa-question-circle red-icon';
      }
    }
  })
  .filter('kubernetesNodeConditionStatusText', function () {
    'use strict';
    return function (status, type) {
      switch (type) {
        case 'Ready':
          switch (status) {
            case 'True':
              return 'OK'
            case 'False':
              return 'Alert'
            case 'Unknown':
              return 'Warning'
          }
          break;
        case 'OutOfDisk':
        case 'MemoryPressure':
        case 'PIDPressure':
        case 'DiskPressure':
        case 'NetworkUnavailable':
          switch (status) {
            case 'True':
              return 'Warning'
            case 'False':
              return 'OK'
          }
          break;
        default:
          return 'Unknown';
      }
    }
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
    }
  })
