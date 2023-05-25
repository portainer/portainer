import { IComponentOptions } from 'angular';

import controller from './git-form-auth-fieldset.controller';

export const gitFormAuthFieldset: IComponentOptions = {
  controller,
  template: `
<ng-form name="$ctrl.gitFormAuthFieldset">
  <react-git-form-auth-fieldset
    value="$ctrl.value"
    on-change="$ctrl.handleChange"
    is-auth-explanation-visible="$ctrl.isAuthExplanationVisible"
    errors="$ctrl.errors"
    is-auth-edit="$ctrl.isAuthEdit">
  </react-git-form-auth-fieldset>
</ng-form>`,
  bindings: {
    value: '<',
    onChange: '<',
    isAuthExplanationVisible: '<',
    isAuthEdit: '<',
  },
};
