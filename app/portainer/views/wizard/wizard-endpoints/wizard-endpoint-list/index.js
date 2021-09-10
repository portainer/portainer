import angular from 'angular';
import './wizard-endpoint-list.css';

angular.module('portainer.app').component('wizardEndpointList', {
  templateUrl: './wizard-endpoint-list.html',
  bindings: {
    endpointList: '<',
  },
});
