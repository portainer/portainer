import { ColumnDef } from '@tanstack/react-table';

import { User } from '@/portainer/users/types';

import { name } from './name-column';
import { teamRole } from './team-role-column';

export const columns = [name, teamRole] as Array<ColumnDef<User>>;
