import angular from 'angular';
import controller from './settingsEdgeComputeController';

angular.module('portainer.app').component('settingsEdgeComputeView', {
  templateUrl: './settingsEdgeCompute.html',
  controller,
});
