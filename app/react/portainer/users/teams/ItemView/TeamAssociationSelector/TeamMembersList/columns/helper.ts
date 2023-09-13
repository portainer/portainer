import { createColumnHelper } from '@tanstack/react-table';

import { User } from '@/portainer/users/types';

export const columnHelper = createColumnHelper<User>();
