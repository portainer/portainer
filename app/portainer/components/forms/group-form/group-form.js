import angular from 'angular';
import GroupFormController from './groupFormController';

angular.module('portainer.app').component('groupForm', {
  templateUrl: './groupForm.html',
  controller: GroupFormController,
  bindings: {
    loaded: '<',
    pageType: '@',
    model: '=',
    availableEndpoints: '=',
    associatedEndpoints: '=',
    addLabelAction: '<',
    removeLabelAction: '<',
    formAction: '<',
    formActionLabel: '@',
    actionInProgress: '<',
  },
});
