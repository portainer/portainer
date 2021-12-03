angular.module('portainer.app').component('slider', {
  templateUrl: './slider.html',
  controller: 'SliderController',
  bindings: {
    model: '=',
    onChange: '<',
    floor: '<',
    ceil: '<',
    step: '<',
    precision: '<',
  },
});
