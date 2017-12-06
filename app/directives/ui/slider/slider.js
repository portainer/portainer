angular.module('ui').component('slider', {
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
