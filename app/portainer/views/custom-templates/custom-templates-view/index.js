import CustomTemplatesViewController from './customTemplatesViewController.js';

angular.module('portainer.app').component('customTemplatesView', {
  templateUrl: './customTemplatesView.html',
  controller: CustomTemplatesViewController,
  bindings: {
    endpoint: '<',
  },
});
