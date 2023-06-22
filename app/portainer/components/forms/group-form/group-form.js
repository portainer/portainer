import angular from 'angular';
import GroupFormController from './groupFormController';

angular.module('portainer.app').component('groupForm', {
  templateUrl: './groupForm.html',
  controller: GroupFormController,
  bindings: {
    loaded: '<',
    model: '=',
    associatedEndpoints: '=',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',

    onChangeEnvironments: '<',
  },
});
