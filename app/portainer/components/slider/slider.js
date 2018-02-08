angular.module('portainer.app').component('slider', {
  templateUrl: 'app/portainer/components/slider/slider.html',
  controller: 'SliderController',
  bindings: {
    model: '=',
    onChange: '&',
    floor: '<',
    ceil: '<',
    step: '<',
    precision: '<'
  }
});
