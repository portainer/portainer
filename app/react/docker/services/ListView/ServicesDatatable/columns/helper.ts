import { createColumnHelper } from '@tanstack/react-table';

import { ServiceViewModel } from '@/docker/models/service';

export const columnHelper = createColumnHelper<ServiceViewModel>();
