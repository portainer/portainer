import _ from 'lodash-es';

angular
  .module('portainer.kubernetes')
  .filter('kubernetesPodStatusColor', function () {
    'use strict';
    return function (text) {
      var status = _.toLower(text);
      switch (status) {
        case 'running':
          return 'success';
        case 'waiting':
          return 'warning';
        case 'terminated':
          return 'info';
        default:
          return 'danger';
      }
    };
  })
  .filter('kubernetesPodConditionStatusBadge', function () {
    'use strict';
    return function (status, type) {
      switch (type) {
        case 'Unschedulable':
          switch (status) {
            case 'True':
              return 'fa-exclamation-triangle red-icon';
            case 'False':
              return 'fa-check green-icon';
            case 'Unknown':
              return 'fa-exclamation-circle orange-icon';
          }
          break;
        case 'PodScheduled':
        case 'Ready':
        case 'Initialized':
        case 'ContainersReady':
          switch (status) {
            case 'True':
              return 'fa-check green-icon';
            case 'False':
              return 'fa-exclamation-triangle red-icon';
            case 'Unknown':
              return 'fa-exclamation-circle orange-icon';
          }
          break;
        default:
          return 'fa-question-circle red-icon';
      }
    };
  })
  .filter('kubernetesPodConditionStatusText', function () {
    'use strict';
    return function (status, type) {
      switch (type) {
        case 'Unschedulable':
          switch (status) {
            case 'True':
              return 'Alert';
            case 'False':
              return 'OK';
            case 'Unknown':
              return 'Warning';
          }
          break;
        case 'PodScheduled':
        case 'Ready':
        case 'Initialized':
        case 'ContainersReady':
          switch (status) {
            case 'True':
              return 'Ok';
            case 'False':
              return 'Alert';
            case 'Unknown':
              return 'Warning';
          }
          break;
        default:
          return 'Unknown';
      }
    };
  });
