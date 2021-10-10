import angular from 'angular';
import controller from './kubernetes-redeploy-app-git-form.controller';

const kubernetesRedeployAppGitForm = {
  templateUrl: './kubernetes-redeploy-app-git-form.html',
  controller,
  bindings: {
    stack: '<',
    namespace: '<',
  },
};

angular.module('portainer.app').component('kubernetesRedeployAppGitForm', kubernetesRedeployAppGitForm);
