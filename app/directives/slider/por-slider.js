angular.module('portainer').component('porSlider', {
  templateUrl: 'app/directives/slider/porSlider.html',
  controller: 'porSliderController',
  bindings: {
    model: '=',
    onChange: '&',
    floor: '<',
    ceil: '<',
    step: '<',
    precision: '<'
  }
});
