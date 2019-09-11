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