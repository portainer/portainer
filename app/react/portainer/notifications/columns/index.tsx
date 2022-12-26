import { ColumnDef } from '@tanstack/react-table';

import { ToastNotification } from '../types';

import { type } from './type';
import { title } from './title';
import { details } from './details';
import { time } from './time';

export const columns = [type, title, details, time] as Array<
  ColumnDef<ToastNotification>
>;
