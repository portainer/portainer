import controller from './licenses-form.controller';
import './licenses-form.css';

export const licensesForm = {
  templateUrl: './licenses-form.html',
  controller,
  bindings: {
    licenses: '<',
    onSubmitSuccess: '<',
  },
};
