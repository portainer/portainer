import { ColumnDef } from '@tanstack/react-table';

import { ContainerGroup } from '@/react/azure/types';

import { name } from './name';
import { location } from './location';
import { ports } from './ports';
import { ownership } from './ownership';

export const columns = [name, location, ports, ownership] as Array<
  ColumnDef<ContainerGroup, unknown>
>;
