import { validation } from './validation';
import { toRequest } from './toRequest';
import { toViewModel, getDefaultViewModel } from './toViewModel';

export { LabelsTab } from './LabelsTab';

export { type Values as LabelsTabValues } from './types';

export const labelsTabUtils = {
  toRequest,
  toViewModel,
  validation,
  getDefaultViewModel,
};
