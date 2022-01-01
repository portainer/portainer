import controller from './git-form-auth-fieldset.controller.js';
import './git-form-auth-fieldset.css';

export const gitFormAuthFieldset = {
  templateUrl: './git-form-auth-fieldset.html',
  controller,
  bindings: {
    model: '<',
    onChange: '<',
    showAuthExplanation: '<',
    isEdit: '<',
  },
};
