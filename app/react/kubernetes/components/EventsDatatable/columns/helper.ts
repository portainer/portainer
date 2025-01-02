import { createColumnHelper } from '@tanstack/react-table';
import { Event } from 'kubernetes-types/core/v1';

export const columnHelper = createColumnHelper<Event>();
