import { ColumnDef } from '@tanstack/react-table';

import { NomadEvent } from '@/react/nomad/types';

import { date } from './date';
import { type } from './type';
import { message } from './message';

export const columns = [date, type, message] as Array<ColumnDef<NomadEvent>>;
