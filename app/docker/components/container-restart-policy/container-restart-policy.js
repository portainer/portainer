import angular from 'angular';

angular.module('portainer.docker')
.component('containerRestartPolicy', {
  templateUrl: './container-restart-policy.html',
  controller: 'ContainerRestartPolicyController',
  bindings: {
    'name': '<',
    'maximumRetryCount': '<',
    'updateRestartPolicy': '&'
  }
});
