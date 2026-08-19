import { createColumnHelper } from '@tanstack/react-table';

import { EdgeGroupListItemResponse } from '../../queries/useEdgeGroups';

export const columnHelper = createColumnHelper<EdgeGroupListItemResponse>();
