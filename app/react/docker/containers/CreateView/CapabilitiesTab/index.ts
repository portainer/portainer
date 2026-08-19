import { validation } from './validation';
import { toViewModel, getDefaultViewModel } from './toViewModel';
import { toRequest } from './toRequest';

export {
  CapabilitiesTab,
  type Values as CapabilitiesTabValues,
} from './CapabilitiesTab';

export const capabilitiesTabUtils = {
  toRequest,
  toViewModel,
  validation,
  getDefaultViewModel,
};
