import controller from './registry-form-gitlab.controller';

angular.module('portainer.app').component('registryFormGitlab', {
  templateUrl: './registry-form-gitlab.html',
  controller,
  bindings: {
    model: '=',
    retrieveRegistries: '<',
    createRegistries: '<',
    actionInProgress: '<',
    projects: '=',
    state: '=',
    resetDefaults: '<',
  },
});
