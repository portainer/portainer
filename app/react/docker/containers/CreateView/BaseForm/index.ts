import { getDefaultViewModel, toViewModel } from './toViewModel';
import { toRequest } from './toRequest';
import { validation } from './validation';

export { BaseForm, type Values as BaseFormValues } from './BaseForm';

export const baseFormUtils = {
  toRequest,
  toViewModel,
  validation,
  getDefaultViewModel,
};
