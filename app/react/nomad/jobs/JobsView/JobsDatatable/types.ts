import {
  BasicTableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings {}

export enum DeployType {
  FDO = 'FDO',
  MANUAL = 'MANUAL',
}
