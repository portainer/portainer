import controller from './git-form-auth-fieldset.controller.js';

export const gitFormAuthFieldset = {
  templateUrl: './git-form-auth-fieldset.html',
  controller,
  bindings: {
    model: '<',
    onChange: '<',
  },
};
