import { createColumnHelper } from '@tanstack/react-table';

import { IngressControllerClassMap } from '../../types';

export const columnHelper = createColumnHelper<IngressControllerClassMap>();
