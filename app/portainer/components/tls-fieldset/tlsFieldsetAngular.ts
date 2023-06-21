import { IComponentOptions } from 'angular';

import controller from './tlsFieldsetAngular.controller';

export const tlsFieldsetAngular: IComponentOptions = {
  controller,
  template: `
<ng-form name="$ctrl.tlsFieldset">
  <tls-fieldset-react
    values="$ctrl.values"
    on-change="$ctrl.handleChange"
    errors="$ctrl.errors"
  </tls-fieldset-react>
</ng-form>`,
  bindings: {
    values: '<',
    onChange: '<',
  },
};
