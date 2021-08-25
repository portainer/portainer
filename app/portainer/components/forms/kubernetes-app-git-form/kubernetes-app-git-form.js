import angular from 'angular';
import controller from './kubernetes-app-git-form.controller';

const kubernetesAppGitForm = {
  templateUrl: './kubernetes-app-git-form.html',
  controller,
  bindings: {
    gitFormValues: '<',
    namespace: '<',
    stack: '<',
    isEdit: '<',
  },
};

angular.module('portainer.app').component('kubernetesAppGitForm', kubernetesAppGitForm);
