angular.module('uiv2').component('slider', {
  templateUrl: 'app/directives/ui/slider/slider.html',
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
