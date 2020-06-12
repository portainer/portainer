// TODO: k8s merge - TEST WITH EXISTING SLIDERS !
// Not sure if this is not breaking existing sliders on docker views
// Or sliders with onChange call (docker service update view)
import angular from 'angular';

class SliderController {
  /* @ngInject */
  constructor($scope) {
    this.$scope = $scope;

    this.buildOptions = this.buildOptions.bind(this);
    this.translate = this.translate.bind(this);
  }

  $onChanges() {
    this.buildOptions();
  }

  translate(value, sliderId, label) {
    if ((label === 'floor' && this.floor === 0) || value === 0) {
      return 'unlimited';
    }
    return value;
  }

  buildOptions() {
    this.options = {
      floor: this.floor,
      ceil: this.ceil,
      step: this.step,
      precision: this.precision,
      showSelectionBar: true,
      enforceStep: false,
      translate: this.translate,
      onChange: () => this.onChange(),
    };
  }

  $onInit() {
    this.buildOptions();
  }
}

export default SliderController;
angular.module('portainer.app').controller('SliderController', SliderController);
