import { createColumnHelper } from '@tanstack/react-table';

import { DecoratedVolume } from '../../types';

export const columnHelper = createColumnHelper<DecoratedVolume>();
