import { Configuration } from '../../types';

export interface ConfigMapRowData extends Configuration {
  inUse: boolean;
  isSystem: boolean;
}
