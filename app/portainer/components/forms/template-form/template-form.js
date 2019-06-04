angular.module('portainer.app').component('templateForm', {
  templateUrl: './templateForm.html',
  controller: function() {
    this.state = {
      collapseTemplate: false,
      collapseContainer: false,
      collapseStack: false,
      collapseEnv: false
    };

    this.addPortBinding = function() {
      this.model.Ports.push({ containerPort: '', protocol: 'tcp' });
    };

    this.removePortBinding = function(index) {
      this.model.Ports.splice(index, 1);
    };

    this.addVolume = function () {
      this.model.Volumes.push({ container: '', bind: '', readonly: false, type: 'auto' });
    };

    this.removeVolume = function(index) {
      this.model.Volumes.splice(index, 1);
    };

    this.addLabel = function () {
      this.model.Labels.push({ name: '', value: ''});
    };

    this.removeLabel = function(index) {
      this.model.Labels.splice(index, 1);
    };

    this.addEnvVar = function() {
      this.model.Env.push({ type: 1, name: '', label: '', description: '', default: '', preset: true, select: [] });
    };

    this.removeEnvVar = function(index) {
      this.model.Env.splice(index, 1);
    };

    this.addEnvVarValue = function(env) {
      env.select = env.select || [];
      env.select.push({ name: '', value: '' });
    };

    this.removeEnvVarValue = function(env, index) {
      env.select.splice(index, 1);
    };

    this.changeEnvVarType = function(env) {
      env.preset = env.type === 1;
    };
  },
  bindings: {
    model: '=',
    categories: '<',
    networks: '<',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
    showTypeSelector: '<'
  }
});
