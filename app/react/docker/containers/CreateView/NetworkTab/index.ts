import { validation } from './validation';
import { toRequest } from './toRequest';
import { toViewModel, getDefaultViewModel } from './toViewModel';

export { NetworkTab } from './NetworkTab';
export { type Values as NetworkTabValues } from './types';

export const networkTabUtils = {
  toRequest,
  toViewModel,
  validation,
  getDefaultViewModel,
};
