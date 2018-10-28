import angular from 'angular';

angular.module('portainer.app').component('executeJobForm', {
  templateUrl: './execute-job-form.html',
  controller: 'JobFormController',
  bindings: {
    nodeName: '<'
  }
});
