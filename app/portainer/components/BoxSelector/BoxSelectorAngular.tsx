import {
  IComponentOptions,
  IComponentController,
  IFormController,
  IScope,
} from 'angular';

class BoxSelectorController implements IComponentController {
  formCtrl!: IFormController;

  onChange!: (value: string | number) => void;

  radioName!: string;

  $scope: IScope;

  /* @ngInject */
  constructor($scope: IScope) {
    this.handleChange = this.handleChange.bind(this);

    this.$scope = $scope;
  }

  handleChange(value: string | number, limitedToBE: boolean) {
    this.$scope.$evalAsync(() => {
      this.formCtrl.$setValidity(this.radioName, !limitedToBE, this.formCtrl);
      this.onChange(value);
    });
  }
}

export const BoxSelectorAngular: IComponentOptions = {
  template: `<box-selector-react
    value="$ctrl.value"
    on-change="$ctrl.handleChange"
    options="$ctrl.options"
    radio-name="$ctrl.radioName"
  ></box-selector-react>`,
  bindings: {
    value: '<',
    onChange: '<',
    options: '<',
    radioName: '<',
  },
  require: {
    formCtrl: '^form',
  },
  controller: BoxSelectorController,
};
