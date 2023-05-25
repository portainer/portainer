import { createColumnHelper } from '@tanstack/react-table';

import { NomadEvent } from '@/react/nomad/types';

export const columnHelper = createColumnHelper<NomadEvent>();
