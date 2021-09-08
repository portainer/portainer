import angular from 'angular';
import controller from './helm-add-repository.controller';

angular.module('portainer.kubernetes').component('helmAddRepository', {
  templateUrl: './helm-add-repository.html',
  controller,
  bindings: {
    repos: '<',
    endpoint: '<',
  },
});
