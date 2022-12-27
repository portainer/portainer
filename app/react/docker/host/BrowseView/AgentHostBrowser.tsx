import { ComponentProps } from 'react';

import { FilesTable } from '@/react/docker/components/FilesTable';

import { createPersistedStore } from '@@/datatables/types';
import { useTableState } from '@@/datatables/useTableState';

const tableKey = 'host-browser';

const settingsStore = createPersistedStore(tableKey, {
  desc: true,
  id: 'Dir',
});

interface Props
  extends Omit<
    ComponentProps<typeof FilesTable>,
    'isUploadAllowed' | 'tableState' | 'title'
  > {
  relativePath: string;
}

export function AgentHostBrowser({
  relativePath,
  dataset,
  isRoot,
  onBrowse,
  onDelete,
  onDownload,
  onFileSelectedForUpload,
  onGoToParent,
  onRename,
}: Props) {
  const tableState = useTableState(settingsStore, tableKey);

  return (
    <FilesTable
      tableState={tableState}
      dataset={dataset}
      title={`Host browser - ${relativePath}`}
      isRoot={isRoot}
      onRename={onRename}
      onBrowse={onBrowse}
      onDownload={onDownload}
      onDelete={onDelete}
      isUploadAllowed
      onFileSelectedForUpload={onFileSelectedForUpload}
      onGoToParent={onGoToParent}
    />
  );
}
