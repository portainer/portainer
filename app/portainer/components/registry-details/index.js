import angular from 'angular';

export const registryDetails = {
  templateUrl: './registry-details.html',
  bindings: {
    registry: '<',
  },
};

angular.module('portainer.app').component('registryDetails', registryDetails);
