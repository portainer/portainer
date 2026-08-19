import { createColumnHelper } from '@tanstack/react-table';

import { ToastNotification } from '../types';

export const columnHelper = createColumnHelper<ToastNotification>();
