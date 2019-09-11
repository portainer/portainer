import _ from 'lodash-es';

angular.module('portainer.kubernetes')
.filter('kubernetesContainerStatusColor', function () {
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