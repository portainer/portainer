import { createColumnHelper } from '@tanstack/react-table';

import i18n from '@/i18n';
import { isoDateFromTimestamp } from '@/portainer/filters/filters';

import { AccessToken } from '../../access-tokens/types';

const columnHelper = createColumnHelper<AccessToken>();

export const columns = [
  columnHelper.accessor('description', {
    header: i18n.t('access_tokens.col_description'),
  }),
  columnHelper.accessor('prefix', {
    header: i18n.t('access_tokens.col_prefix'),
  }),
  columnHelper.accessor('dateCreated', {
    header: i18n.t('access_tokens.col_created'),
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
  }),
  columnHelper.accessor('lastUsed', {
    header: i18n.t('access_tokens.col_last_used'),
    cell: ({ getValue }) => isoDateFromTimestamp(getValue()),
  }),
];
