import { SystemResourcesTableSettings } from '@/react/kubernetes/datatables/SystemResourcesSettings';

import {
  BasicTableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import { Application } from '../ApplicationsDatatable/types';

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    SystemResourcesTableSettings {}

export type Stack = {
  Name: string;
  ResourcePool: string;
  Applications: Application[];
  Highlighted: boolean;
};
