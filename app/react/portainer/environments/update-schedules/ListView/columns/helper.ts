import { createColumnHelper } from '@tanstack/react-table';

import { EdgeUpdateListItemResponse } from '../../queries/list';

export const columnHelper = createColumnHelper<EdgeUpdateListItemResponse>();
