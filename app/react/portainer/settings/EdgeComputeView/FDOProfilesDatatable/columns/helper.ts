import { createColumnHelper } from '@tanstack/react-table';

import { Profile } from '@/portainer/hostmanagement/fdo/model';

export const columnHelper = createColumnHelper<Profile>();
