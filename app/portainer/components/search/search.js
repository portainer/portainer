import angular from 'angular';
import controller from './search.controller';

angular.module('portainer.app').component('search', {
  templateUrl: './search.html',
  controller,
});
