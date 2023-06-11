import { ConfigMap } from 'kubernetes-types/core/v1';

export interface ConfigMapRowData extends ConfigMap {
  inUse: boolean;
}
