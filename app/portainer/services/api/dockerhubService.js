import { DockerHubViewModel } from '../../models/dockerhub';

angular.module('portainer.app').factory('DockerHubService', [
  '$q',
  'DockerHub',
  function DockerHubServiceFactory($q, DockerHub) {
    'use strict';
    var service = {};

    service.dockerhub = function () {
      return new DockerHubViewModel();
    };

    service.update = function (dockerhub) {
      return DockerHub.update({}, dockerhub).$promise;
    };

    return service;
  },
]);
