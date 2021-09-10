import angular from 'angular';
import './wizard-stepper.css';

angular.module('portainer.app').component('wizardStepper', {
  templateUrl: './wizard-stepper.html',
  bindings: {
    endpointSelections: '<',
  },
});
