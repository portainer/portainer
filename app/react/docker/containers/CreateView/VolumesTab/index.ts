import { validation } from './validation';
import { toRequest } from './toRequest';
import { toViewModel, getDefaultViewModel } from './toViewModel';

export { VolumesTab } from './VolumesTab';

export { type Values as VolumesTabValues } from './types';

export const volumesTabUtils = {
  toRequest,
  toViewModel,
  validation,
  getDefaultViewModel,
};
