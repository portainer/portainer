angular.module('portainer.app').component('registryFormGitlab', {
  templateUrl: './registry-form-gitlab.html',
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
