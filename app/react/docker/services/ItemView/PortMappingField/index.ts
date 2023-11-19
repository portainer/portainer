import { toRequest } from './toRequest';
import { toViewModel } from './toViewModel';
import { validation } from './validation';

export { PortsMappingField } from './PortsMappingField';
export type { Values as PortsMappingValues } from './PortsMappingField';

export const portsMappingUtils = {
  toRequest,
  toViewModel,
  validation,
};
