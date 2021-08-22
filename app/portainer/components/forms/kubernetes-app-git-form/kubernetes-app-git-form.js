import angular from 'angular';

const kubernetesAppGitForm = {
  templateUrl: './kubernetes-app-git-form.html',
  bindings: {
    onChange: '<',
    onChangeRef: '<',
    showConfig: '<',
    gitFormValues: '<',
  },
};

angular.module('portainer.app').component('kubernetesAppGitForm', kubernetesAppGitForm);
