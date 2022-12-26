import { ColumnDef } from '@tanstack/react-table';

import { IngressControllerClassMap } from '../../types';

import { availability } from './availability';
import { type } from './type';
import { name } from './name';

export const columns = [name, type, availability] as Array<
  ColumnDef<IngressControllerClassMap>
>;
