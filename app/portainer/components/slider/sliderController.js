angular.module('portainer.app')
.controller('SliderController', function () {
  var ctrl = this;

  ctrl.options = {
    floor: ctrl.floor,
    ceil: ctrl.ceil,
    step: ctrl.step,
    precision: ctrl.precision,
    showSelectionBar: true,
    enforceStep: false,
    translate: function(value, sliderId, label) {
      if ((label === 'floor' && ctrl.floor === 0) || value === 0) {
        return 'unlimited';
      }
      return value;
    },
    onChange: function() {
      ctrl.onChange();
    }
  };
});
