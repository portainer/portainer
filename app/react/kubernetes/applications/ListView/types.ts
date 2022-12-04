import {
  BasicTableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import { SystemResourcesTableSettings } from '../../datatables/DefaultDatatableSettings';

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    SystemResourcesTableSettings {}
