angular.module('portainer.app').component('executeJobForm', {
  templateUrl: 'app/portainer/components/forms/execute-job-form/execute-job-form.html',
  controller: 'JobFormController',
  bindings: {
    nodeName: '<'
  }
});
