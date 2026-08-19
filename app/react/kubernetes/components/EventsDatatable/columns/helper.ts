import { createColumnHelper } from '@tanstack/react-table';

import { Event } from '@/react/kubernetes/queries/types';

export const columnHelper = createColumnHelper<Event>();
