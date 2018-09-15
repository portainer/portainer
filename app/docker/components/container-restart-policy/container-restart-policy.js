angular.module('portainer.docker')
.component('containerRestartPolicy', {
  templateUrl: 'app/docker/components/container-restart-policy/container-restart-policy.html',
  controller: 'ContainerRestartPolicyController',
  bindings: {
    'name': '<',
    'maximumRetryCount': '<',
    'updateRestartPolicy': '&'
  }
});
