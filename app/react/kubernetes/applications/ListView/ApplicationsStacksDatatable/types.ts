import { SystemResourcesTableSettings } from '@/react/kubernetes/datatables/SystemResourcesSettings';

import {
  BasicTableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    SystemResourcesTableSettings {}

export interface Namespace {
  Id: string;
  Name: string;
  Yaml: string;
  IsSystem?: boolean;
}
