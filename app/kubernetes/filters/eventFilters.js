import _ from 'lodash-es';

angular.module('portainer.kubernetes').filter('kubernetesEventTypeColor', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    switch (status) {
      case 'normal':
        return 'info';
      case 'warning':
        return 'warning';
      default:
        return 'danger';
    }
  };
});
