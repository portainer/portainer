import { createColumnHelper } from '@tanstack/react-table';

import { IngressControllerClassMapRowData } from '../../types';

export const columnHelper =
  createColumnHelper<IngressControllerClassMapRowData>();
