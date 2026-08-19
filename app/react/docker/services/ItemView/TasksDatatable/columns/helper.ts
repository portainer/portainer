import { createColumnHelper } from '@tanstack/react-table';

import { DecoratedTask } from '../types';

export const columnHelper = createColumnHelper<DecoratedTask>();
