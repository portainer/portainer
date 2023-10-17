import angular from 'angular';
import controller from './helm-templates.controller';

angular.module('portainer.kubernetes').component('helmTemplatesView', {
  templateUrl: './helm-templates.html',
  controller,
  bindings: {
    endpoint: '<',
    namespace: '<',
    stackName: '<',
    onSelectHelmChart: '<',
    name: '<',
  },
});
