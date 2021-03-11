import { DockerHubViewModel } from '../../models/dockerhub';

angular.module('portainer.app').factory('DockerHubService', [
  '$q',
  'DockerHub',
  function DockerHubServiceFactory($q, DockerHub) {
    'use strict';
    var service = {};

    service.dockerhub = function () {
      const data = {
        Authentication: false,
        Password: undefined,
        URL: 'docker.io',
        Username: '',
      };

      return new DockerHubViewModel(data);
    };

    service.update = function (dockerhub) {
      return DockerHub.update({}, dockerhub).$promise;
    };

    return service;
  },
]);
