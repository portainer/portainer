import { createColumnHelper } from '@tanstack/react-table';

import { Application } from '@/react/kubernetes/applications/ListView/ApplicationsDatatable/types';

export const helper = createColumnHelper<Application>();
