import {
  BasicTableSettings,
  RefreshableTableSettings,
} from '@@/datatables/types';

import { SystemResourcesTableSettings } from '../../datatables/SystemResourcesSettings';

export interface TableSettings
  extends BasicTableSettings,
    RefreshableTableSettings,
    SystemResourcesTableSettings {}
