import {
  IComponentOptions,
  IComponentController,
  IFormController,
  IScope,
  IOnChangesObject,
} from 'angular';

import { VariableDefinition } from '@/react/portainer/custom-templates/components/CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

class VariablesFieldController implements IComponentController {
  formCtrl!: IFormController;

  value!: Record<string, string>;

  definitions!: VariableDefinition[];

  onChange!: (value: Record<string, string>) => void;

  $scope: IScope;

  /* @ngInject */
  constructor($scope: IScope) {
    this.handleChange = this.handleChange.bind(this);

    this.$scope = $scope;
  }

  handleChange(value: Record<string, string>) {
    this.$scope.$evalAsync(() => {
      this.onChange(value);
    });
  }

  $onChanges({ value }: IOnChangesObject) {
    if (value.currentValue) {
      this.checkValidity(value.currentValue);
    }
  }

  checkValidity(value: Record<string, string>) {
    this.formCtrl.$setValidity(
      'templateVariables',
      Object.entries(value).every(
        ([name, value]) =>
          !!value ||
          this.definitions.some(
            (def) => def.name === name && !!def.defaultValue
          )
      ),
      this.formCtrl
    );
  }
}

export const VariablesFieldAngular: IComponentOptions = {
  template: `<custom-templates-variables-field-react
    value="$ctrl.value"
    on-change="$ctrl.handleChange"
    definitions="$ctrl.definitions"
  ></custom-templates-variables-field-react>`,
  bindings: {
    value: '<',
    definitions: '<',
    onChange: '<',
  },
  require: {
    formCtrl: '^form',
  },
  controller: VariablesFieldController,
};
