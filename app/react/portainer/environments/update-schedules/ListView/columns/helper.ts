import { createColumnHelper } from '@tanstack/react-table';

import { DecoratedItem } from '../types';

export const columnHelper = createColumnHelper<DecoratedItem>();
