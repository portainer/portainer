import { createColumnHelper } from '@tanstack/react-table';

import { DecoratedUser } from '../types';

export const helper = createColumnHelper<DecoratedUser>();
