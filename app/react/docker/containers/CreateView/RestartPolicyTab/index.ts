import { validation } from './validation';
import { toViewModel, getDefaultViewModel } from './toViewModel';
import { toRequest } from './toRequest';

export { RestartPolicyTab } from './RestartPolicyTab';
export { RestartPolicy } from './types';

export const restartPolicyTabUtils = {
  toViewModel,
  toRequest,
  validation,
  getDefaultViewModel,
};
