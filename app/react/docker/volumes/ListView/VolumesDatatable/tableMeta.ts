import { TableMeta as BaseTableMeta } from '@tanstack/react-table';

import { VolumeViewModel } from '@/docker/models/volume';

interface TableMeta {
  isBrowseVisible: boolean;
  table: 'volumes';
}

function isTableMeta(meta: BaseTableMeta<VolumeViewModel>): meta is TableMeta {
  return meta.table === 'volumes';
}

export function getTableMeta(meta?: BaseTableMeta<VolumeViewModel>): TableMeta {
  if (!meta || !isTableMeta(meta)) {
    return {
      isBrowseVisible: false,
      table: 'volumes',
    };
  }

  return meta;
}
