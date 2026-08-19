import { validation } from './validation';
import { toRequest } from './toRequest';
import { toViewModel, getDefaultViewModel } from './toViewModel';

export {
  ResourcesTab,
  type Values as ResourcesTabValues,
} from './ResourcesTab';

export const resourcesTabUtils = {
  toRequest,
  toViewModel,
  validation,
  getDefaultViewModel,
};
