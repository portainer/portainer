import { Secret } from 'kubernetes-types/core/v1';

export interface SecretRowData extends Secret {
  inUse: boolean;
}
