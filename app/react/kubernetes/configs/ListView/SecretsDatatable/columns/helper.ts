import { createColumnHelper } from '@tanstack/react-table';

import { SecretRowData } from '../types';

export const columnHelper = createColumnHelper<SecretRowData>();
