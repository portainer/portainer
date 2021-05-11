import angular from 'angular';
import controller from './stack-redeploy-git-form.controller.js';

export const stackRedeployGitForm = {
  templateUrl: './stack-redeploy-git-form.html',
  controller,
  bindings: {
    model: '<',
    stack: '<',
  },
};

angular.module('portainer.app').component('stackRedeployGitForm', stackRedeployGitForm);
