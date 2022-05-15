import {
  IComponentOptions,
  IComponentController,
  IFormController,
  IScope,
} from 'angular';

import { VariableDefinition } from '../CustomTemplatesVariablesDefinitionField/CustomTemplatesVariablesDefinitionField';

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
      this.onChange(value);
    });
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
