import angular from 'angular';

angular.module('portainer.app').component('wizardTls', {
  templateUrl: './wizard-tls.html',
  bindings: {
    formData: '<',
    onChange: '<',
  },
});
