import { Configuration } from '../../types';

export interface SecretRowData extends Configuration {
  inUse: boolean;
  isSystem: boolean;
}
